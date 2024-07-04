/**
 * @fileoverview Background service for preview service. This service is responsible for generating 360 previews for objects.
 */
//FIXME this doesn't quite fit in the /server directory, but it's not a service either. It's a background worker.
import { updateHealthcheckDataFactory } from '#src/clients/execHealthcheck.js'
import { generatePreviewFactory } from '#src/clients/previewService.js'
import { extendLoggerComponent, logger } from '#src/observability/logging.js'
import { initPrometheusMetrics } from '#src/observability/prometheusMetrics.js'
import {
  getNextUnstartedObjectPreviewFactory,
  notifyUpdateFactory,
  updatePreviewMetadataFactory
} from '#src/repositories/objectPreview.js'
import { insertPreviewFactory } from '#src/repositories/previews.js'
import { generateAndStore360PreviewFactory } from '#src/services/360preview.js'
import { pollForAndCreatePreviewFactory } from '#src/services/pollForPreview.js'
import { forceExit, repeatedlyDoSomeWorkFactory } from '#src/services/taskManager.js'
import { getHealthCheckFilePath, serviceOrigin } from '#src/utils/env.js'
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
  repeatedlyDoSomeWorkFactory({
    doSomeWork: pollForAndCreatePreviewFactory({
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
      logger: backgroundLogger
    }),
    onExit: () => {
      process.exit(0)
    },
    delayPeriods: {
      onSuccess: 10,
      onNoWorkFound: 1000,
      onFailed: 5000
    }
  })()
}
