import http from 'http'
import prometheusClient, { Counter, Summary } from 'prom-client'
import { getDbClients } from '@/knex.js'
import { Knex } from 'knex'
import { Pool } from 'tarn'
import { isObject } from 'lodash-es'
import { IncomingMessage } from 'http'

let metricQueryDuration: Summary<string> | null = null
let metricQueryErrors: Counter<string> | null = null

const queryStartTime: Record<string, number> = {}
prometheusClient.register.clear()
prometheusClient.register.setDefaultLabels({
  project: 'speckle-server',
  app: 'fileimport-service'
})
prometheusClient.collectDefaultMetrics()

let prometheusInitialized = false

const initDBPrometheusMetricsFactory =
  ({ db }: { db: Knex }) =>
  () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dbConnectionPool = db.client.pool as Pool<unknown>
    new prometheusClient.Gauge({
      name: 'speckle_server_knex_free',
      help: 'Number of free DB connections',
      collect() {
        this.set(dbConnectionPool.numFree())
      }
    })

    new prometheusClient.Gauge({
      name: 'speckle_server_knex_used',
      help: 'Number of used DB connections',
      collect() {
        this.set(dbConnectionPool.numUsed())
      }
    })

    new prometheusClient.Gauge({
      name: 'speckle_server_knex_pending',
      help: 'Number of pending DB connection aquires',
      collect() {
        this.set(dbConnectionPool.numPendingAcquires())
      }
    })

    new prometheusClient.Gauge({
      name: 'speckle_server_knex_pending_creates',
      help: 'Number of pending DB connection creates',
      collect() {
        this.set(dbConnectionPool.numPendingCreates())
      }
    })

    new prometheusClient.Gauge({
      name: 'speckle_server_knex_pending_validations',
      help: 'Number of pending DB connection validations. This is a state between pending acquisition and acquiring a connection.',
      collect() {
        this.set(dbConnectionPool.numPendingValidations())
      }
    })

    new prometheusClient.Gauge({
      name: 'speckle_server_knex_remaining_capacity',
      help: 'Remaining capacity of the DB connection pool',
      collect() {
        const postgresMaxConnections = parseInt(
          process.env['POSTGRES_MAX_CONNECTIONS_FILE_IMPORT_SERVICE'] || '1'
        )
        const demand =
          dbConnectionPool.numUsed() +
          dbConnectionPool.numPendingCreates() +
          dbConnectionPool.numPendingValidations() +
          dbConnectionPool.numPendingAcquires()

        this.set(Math.max(postgresMaxConnections - demand, 0))
      }
    })

    metricQueryDuration = new prometheusClient.Summary({
      name: 'speckle_server_knex_query_duration',
      help: 'Summary of the DB query durations in seconds'
    })

    metricQueryErrors = new prometheusClient.Counter({
      name: 'speckle_server_knex_query_errors',
      help: 'Number of DB queries with errors'
    })

    db.on('query', (data) => {
      if (!isObject(data) || !('__knexQueryUid' in data)) return
      const queryId = String(data.__knexQueryUid)
      queryStartTime[queryId] = Date.now()
    })

    db.on('query-response', (_data, obj) => {
      if (!isObject(obj) || !('__knexQueryUid' in obj)) return
      const queryId = String(obj.__knexQueryUid)
      const durationSec = (Date.now() - queryStartTime[queryId]) / 1000
      delete queryStartTime[queryId]
      if (metricQueryDuration && !isNaN(durationSec))
        metricQueryDuration.observe(durationSec)
    })

    db.on('query-error', (_err, querySpec) => {
      if (!isObject(querySpec) || !('__knexQueryUid' in querySpec)) return
      const queryId = String(querySpec.__knexQueryUid)
      const durationSec = (Date.now() - queryStartTime[queryId]) / 1000
      delete queryStartTime[queryId]

      if (metricQueryDuration && !isNaN(durationSec))
        metricQueryDuration.observe(durationSec)
      if (metricQueryErrors) metricQueryErrors.inc()
    })
  }

export async function initPrometheusMetrics() {
  if (prometheusInitialized) return
  prometheusInitialized = true

  const db = (await getDbClients()).main.public

  initDBPrometheusMetricsFactory({ db })()

  const requestHandler = async (req: IncomingMessage, res: http.OutgoingMessage) => {
    if (req.url === '/metrics') {
      res.setHeader('Content-Type', prometheusClient.register.contentType)
      const metrics = await prometheusClient.register.metrics()
      res.end(metrics)
    } else {
      res.end('Speckle FileImport Service - prometheus metrics')
    }
  }

  // Define the HTTP server
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const server = http.createServer(requestHandler)
  server.listen(Number(process.env.PROMETHEUS_METRICS_PORT) || 9093)
}

export const metricDuration = new prometheusClient.Histogram({
  name: 'speckle_server_operation_duration',
  help: 'Summary of the operation durations in seconds',
  buckets: [0.5, 1, 5, 10, 30, 60, 300, 600, 900, 1200],
  labelNames: ['op']
})

export const metricOperationErrors = new prometheusClient.Counter({
  name: 'speckle_server_operation_errors',
  help: 'Number of operations with errors',
  labelNames: ['op']
})

export const metricInputFileSize = new prometheusClient.Histogram({
  name: 'speckle_server_operation_file_size',
  help: 'Size of the operation input file size',
  buckets: [
    1000,
    100 * 1000,
    500 * 1000,
    1000 * 1000,
    5 * 1000 * 1000,
    10 * 1000 * 1000,
    100 * 1000 * 1000
  ],
  labelNames: ['op']
})
