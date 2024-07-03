/**
 * @fileoverview Background service for preview service. This service is responsible for generating 360 previews for objects.
 */
//FIXME this doesn't quite fit in the /server directory, but it's not a service either. It's a background worker.
import { updateHealthcheckDataFactory } from '@/clients/execHealthcheck.js'
import { generatePreviewFactory } from '@/clients/previewService.js'
import { extendLoggerComponent, logger } from '@/observability/logging.js'
import { initPrometheusMetrics } from '@/observability/prometheusMetrics.js'
import {
  getNextUnstartedObjectPreviewFactory,
  notifyUpdateFactory,
  updatePreviewMetadataFactory
} from '@/repositories/objectPreview.js'
import { insertPreviewFactory } from '@/repositories/previews.js'
import { generateAndStore360PreviewFactory } from '@/services/360preview.js'
import { forceExit, repeatedlyPollForWorkFactory } from '@/services/taskManager.js'
import { getHealthCheckFilePath, serviceOrigin } from '@/utils/env.js'
import type { Knex } from 'knex'

export function startPreviewService(params: { db: Knex }) {
  const { db } = params
  const backgroundLogger = extendLoggerComponent(logger, 'backgroundWorker')
  backgroundLogger.info('📸 Starting Preview Service background worker')

  process.on('SIGTERM', () => {
    forceExit()
    backgroundLogger.info('Shutting down...')
  })

  process.on('SIGINT', () => {
    forceExit()
    backgroundLogger.info('Shutting down...')
  })

  initPrometheusMetrics({ db })
  repeatedlyPollForWorkFactory({
    updateHealthcheckData: updateHealthcheckDataFactory({
      healthCheckFilePath: getHealthCheckFilePath()
    }),
    getNextUnstartedObjectPreview: getNextUnstartedObjectPreviewFactory({ db }),
    generateAndStore360Preview: generateAndStore360PreviewFactory({
      generatePreview: generatePreviewFactory({ serviceOrigin: serviceOrigin() }),
      insertPreview: insertPreviewFactory({ db })
    }),
    updatePreviewMetadata: updatePreviewMetadataFactory({ db }),
    notifyUpdate: notifyUpdateFactory({ db }),
    onExit: () => {
      process.exit(0)
    },
    logger: backgroundLogger
  })()
}
