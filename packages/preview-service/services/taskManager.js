'use strict'

const { logger } = require('../observability/logging')
const metrics = require('../observability/prometheusMetrics')
const { getNextUnstartedObjectPreview } = require('../repositories/objectPreview')
const { generateAndStore360Preview } = require('./360preview')
const fs = require('fs')

const HEALTHCHECK_FILE_PATH = '/tmp/last_successful_query'
let shouldExit = false

function forceExit() {
  shouldExit = true
}

async function repeatedlyPollForWork() {
  if (shouldExit) {
    process.exit(0)
  }

  if (!metrics.metricDuration || !metrics.metricOperationErrors) {
    logger.warn('Metrics not initialized yet...')
  }

  try {
    const task = await getNextUnstartedObjectPreview()

    fs.writeFile(HEALTHCHECK_FILE_PATH, '' + Date.now(), () => {})

    if (!task) {
      setTimeout(repeatedlyPollForWork, 1000)
      return
    }

    let metricDurationEnd = undefined
    if (metrics.metricDuration) {
      metricDurationEnd = metrics.metricDuration.startTimer()
    }

    await generateAndStore360Preview(task)

    if (metricDurationEnd) {
      metricDurationEnd({ op: 'preview' })
    }

    // Check for another task very soon
    setTimeout(repeatedlyPollForWork, 10)
  } catch (err) {
    if (metrics.metricOperationErrors) {
      metrics.metricOperationErrors.labels('main_loop').inc()
    }
    logger.error(err, 'Error executing task')
    setTimeout(repeatedlyPollForWork, 5000)
  }
}

module.exports = { repeatedlyPollForWork, forceExit }
