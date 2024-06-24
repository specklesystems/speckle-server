/**
 * @fileoverview Background service for preview service. This service is responsible for generating 360 previews for objects.
 */
//FIXME this doesn't quite fit in the /server directory, but it's not a service either. It's a background worker.
'use strict'

const { initPrometheusMetrics } = require('../observability/prometheusMetrics')
const { logger } = require('../observability/logging')
const { repeatedlyPollForWork, forceExit } = require('../services/taskManager')

async function startPreviewService() {
  logger.info('📸 Started Preview Service background worker')

  process.on('SIGTERM', () => {
    forceExit()
    logger.info('Shutting down...')
  })

  process.on('SIGINT', () => {
    forceExit()
    logger.info('Shutting down...')
  })

  initPrometheusMetrics()
  repeatedlyPollForWork()
}

module.exports = { startPreviewService }
