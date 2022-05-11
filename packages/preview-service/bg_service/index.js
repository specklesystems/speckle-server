'use strict'

const crypto = require('crypto')
const knex = require('../knex')
const fetch = require('node-fetch')
const fs = require('fs')
const metrics = require('./prometheusMetrics')

let shouldExit = false

const HEALTHCHECK_FILE_PATH = '/tmp/last_successful_query'

async function startTask() {
  const { rows } = await knex.raw(`
    UPDATE object_preview
    SET 
      "previewStatus" = 1,
      "lastUpdate" = NOW()
    FROM (
      SELECT "streamId", "objectId" FROM object_preview
      WHERE "previewStatus" = 0 OR ("previewStatus" = 1 AND "lastUpdate" < NOW() - INTERVAL '1 WEEK')
      ORDER BY "priority" ASC, "lastUpdate" ASC
      LIMIT 1
    ) as task
    WHERE object_preview."streamId" = task."streamId" AND object_preview."objectId" = task."objectId"
    RETURNING object_preview."streamId", object_preview."objectId"
  `)
  return rows[0]
}

async function doTask(task) {
  const previewUrl = `http://127.0.0.1:3001/preview/${task.streamId}/${task.objectId}`

  try {
    let res = await fetch(previewUrl)
    res = await res.json()
    // let imgBuffer = await res.buffer()  // this gets the binary response body

    const metadata = {}

    for (const angle in res) {
      const imgBuffer = new Buffer.from(
        res[angle].replace(/^data:image\/\w+;base64,/, ''),
        'base64'
      )
      const previewId = crypto.createHash('md5').update(imgBuffer).digest('hex')

      // Save preview image
      await knex.raw(
        'INSERT INTO "previews" (id, data) VALUES (?, ?) ON CONFLICT DO NOTHING',
        [previewId, imgBuffer]
      )

      metadata[angle] = previewId
    }

    // Update preview metadata
    await knex.raw(
      `
      UPDATE object_preview
      SET
        "previewStatus" = 2,
        "lastUpdate" = NOW(),
        "preview" = ?
      WHERE "streamId" = ? AND "objectId" = ?
    `,
      [metadata, task.streamId, task.objectId]
    )
  } catch (err) {
    // Update preview metadata
    await knex.raw(
      `
      UPDATE object_preview
      SET
        "previewStatus" = 3,
        "lastUpdate" = NOW(),
        "preview" = ?
      WHERE "streamId" = ? AND "objectId" = ?
    `,
      [{}, task.streamId, task.objectId]
    )
    metrics.metricOperationErrors.labels('preview').inc()
  }
}

async function tick() {
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

    metricDurationEnd({ op: 'preview' })

    // Check for another task very soon
    setTimeout(tick, 10)
  } catch (err) {
    metrics.metricOperationErrors.labels('main_loop').inc()
    console.log('Error executing task: ', err)
    setTimeout(tick, 5000)
  }
}

async function startPreviewService() {
  console.log('📸 Started Preview Service')

  process.on('SIGTERM', () => {
    shouldExit = true
    console.log('Shutting down...')
  })

  process.on('SIGINT', () => {
    shouldExit = true
    console.log('Shutting down...')
  })

  metrics.initPrometheusMetrics()

  tick()
}

module.exports = { startPreviewService }
