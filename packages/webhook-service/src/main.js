'use strict'

const crypto = require('crypto')
const knex = require('./knex')
const fs = require('fs')
const metrics = require('./observability/prometheusMetrics')
const { logger } = require('./observability/logging')

let shouldExit = false
const HEALTHCHECK_FILE_PATH = '/tmp/last_successful_query'

const { makeNetworkRequest } = require('./webhookCaller')
const WebhookError = require('./errors')

const startTaskFactory =
  ({ db }) =>
  async () => {
    const { rows } = await db.raw(`
    UPDATE webhooks_events
    SET
      "status" = 1,
      "lastUpdate" = NOW()
    FROM (
      SELECT "id" FROM webhooks_events
      WHERE "status" = 0
      ORDER BY "lastUpdate" ASC
      LIMIT 1
    ) as task
    WHERE webhooks_events."id" = task."id"
    RETURNING webhooks_events."id"
  `)
    return rows[0]
  }

const doTaskFactory =
  ({ db }) =>
  async (task) => {
    let boundLogger = logger.child({ taskId: task.id })
    try {
      const { rows } = await db.raw(
        `
      SELECT
        ev.payload as evt,
        cnf.id as wh_id, cnf.url as wh_url, cnf.secret as wh_secret, cnf.enabled as wh_enabled
      FROM webhooks_events ev
      INNER JOIN webhooks_config cnf ON ev."webhookId" = cnf.id
      WHERE ev.id = ?
      LIMIT 1
    `,
        [task.id]
      )
      const info = rows[0]
      if (!info) {
        throw new Error('Internal error: DB inconsistent')
      }
      boundLogger = boundLogger.child({ webhookId: info.wh_id })

      const fullPayload = JSON.parse(info.evt)
      boundLogger = boundLogger.child({
        streamId: fullPayload.streamId,
        eventName: fullPayload.event.event_name
      })

      const postData = { payload: fullPayload }

      const signature = crypto
        .createHmac('sha256', info.wh_secret || '')
        .update(JSON.stringify(postData))
        .digest('hex')
      const postHeaders = { 'X-WEBHOOK-SIGNATURE': signature }

      boundLogger.info('Calling webhook.')
      const result = await makeNetworkRequest({
        url: info.wh_url,
        data: postData,
        headersData: postHeaders,
        logger: boundLogger
      })

      boundLogger.info({ result }, `Received response from webhook.`)

      if (!result.success) {
        throw new WebhookError(
          result.error,
          'Calling webhook was unsuccessful.',
          result.responseCode,
          result.responseBody
        )
      }

      await db.raw(
        `
      UPDATE webhooks_events
      SET
        "status" = 2,
        "lastUpdate" = NOW(),
        "statusInfo" = 'Webhook called'
      WHERE "id" = ?
    `,
        [task.id]
      )
    } catch (err) {
      switch (err.constructor) {
        case WebhookError:
          boundLogger.warn({ err }, 'Failed to trigger webhook event.')
          break
        default:
          boundLogger.error(err, 'Failed to trigger webhook event.')
      }
      await db.raw(
        `
      UPDATE webhooks_events
      SET
        "status" = 3,
        "lastUpdate" = NOW(),
        "statusInfo" = ?
      WHERE "id" = ?
    `,
        [err.toString(), task.id]
      )
      metrics.metricOperationErrors.labels('webhook').inc()
    }
  }

const tickFactory =
  ({ doTask, startTask, tick }) =>
  async () => {
    if (shouldExit) {
      process.exit(0)
    }

    try {
      const task = await startTask()

      fs.writeFile(HEALTHCHECK_FILE_PATH, '' + Date.now(), () => {})

      if (!task) {
        setTimeout(tick, 1000)
        return
      }

      const metricDurationEnd = metrics.metricDuration.startTimer()

      await doTask(task)

      metricDurationEnd({ op: 'webhook' })

      // Check for another task very soon
      setTimeout(tick, 10)
    } catch (err) {
      metrics.metricOperationErrors.labels('main_loop').inc()
      logger.error(err, 'Error executing task')
      setTimeout(tick, 5000)
    }
  }

async function main() {
  logger.info('Starting Webhook Service...')

  process.on('SIGTERM', () => {
    shouldExit = true
    logger.info('Shutting down...')
  })
  metrics.initPrometheusMetrics()

  const tick = tickFactory({
    doTask: doTaskFactory({ db: knex }),
    startTask: startTaskFactory({ db: knex }),
    tick: (...args) => tick(...args)
  })
  tick()
}

main()
