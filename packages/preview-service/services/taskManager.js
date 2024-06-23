'use strict'

const metrics = require('../observability/prometheusMetrics')
const { logger } = require('../observability/logging')
const { getNextUnstartedObjectPreview } = require('../repositories/objectPreview')
const { generateAndStore360Preview } = require('./360preview')
const fs = require('fs')

const HEALTHCHECK_FILE_PATH = '/tmp/last_successful_query'

let shouldExit = false

async function repeatedlyPollForWork() {
  if (shouldExit) {
    process.exit(0)
  }

  try {
    const task = await getNextUnstartedObjectPreview()

    fs.writeFile(HEALTHCHECK_FILE_PATH, '' + Date.now(), () => {})

    if (!task) {
      setTimeout(repeatedlyPollForWork, 1000)
      return
    }

    const metricDurationEnd = metrics.metricDuration.startTimer()

    await generateAndStore360Preview(task)

    metricDurationEnd({ op: 'preview' })

    // Check for another task very soon
    setTimeout(repeatedlyPollForWork, 10)
  } catch (err) {
    metrics.metricOperationErrors.labels('main_loop').inc()
    logger.error(err, 'Error executing task')
    setTimeout(repeatedlyPollForWork, 5000)
  }
}

async function startPreviewService() {
  logger.info('📸 Started Preview Service')

  process.on('SIGTERM', () => {
    shouldExit = true
    logger.info('Shutting down...')
  })

  process.on('SIGINT', () => {
    shouldExit = true
    logger.info('Shutting down...')
  })

  repeatedlyPollForWork()
}

module.exports = { startPreviewService }
