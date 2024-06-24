/**
 * @fileoverview Background service for preview service. This service is responsible for generating 360 previews for objects.
 */
//FIXME this doesn't quite fit in the /server directory, but it's not a service either. It's a background worker.
import { initPrometheusMetrics } from '../observability/prometheusMetrics'
import { logger } from '../observability/logging'
import { forceExit, repeatedlyPollForWorkFactory } from '../services/taskManager'
import {
  getNextUnstartedObjectPreviewFactory,
  notifyUpdateFactory,
  updatePreviewMetadataFactory
} from 'repositories/objectPreview'
import db from 'repositories/knex'
import { generateAndStore360PreviewFactory } from 'services/360preview'
import { insertPreviewFactory } from 'repositories/previews'

export async function startPreviewService() {
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
  await repeatedlyPollForWorkFactory({
    getNextUnstartedObjectPreview: getNextUnstartedObjectPreviewFactory({ db }),
    generateAndStore360Preview: generateAndStore360PreviewFactory({
      updatePreviewMetadata: updatePreviewMetadataFactory({ db }),
      notifyUpdate: notifyUpdateFactory({ db }),
      insertPreview: insertPreviewFactory({ db })
    })
  })()
}
