/**
 * @fileoverview Background service for preview service. This service is responsible for generating 360 previews for objects.
 */
//FIXME this doesn't quite fit in the /server directory, but it's not a service either. It's a background worker.
import { updateHealthcheckDataFactory } from '@/clients/execHealthcheck.js'
import { generatePreviewFactory } from '@/clients/previewService.js'
import { WorkStatus } from '@/domain/backgroundWorker.js'
import { extendLoggerComponent, logger } from '@/observability/logging.js'
import { initPrometheusMetrics } from '@/observability/prometheusMetrics.js'
import {
  getNextUnstartedObjectPreviewFactory,
  notifyUpdateFactory,
  updatePreviewMetadataFactory
} from '@/repositories/objectPreview.js'
import { insertPreviewFactory } from '@/repositories/previews.js'
import { generateAndStore360PreviewFactory } from '@/services/360preview.js'
import { pollForAndCreatePreviewFactory } from '@/services/pollForPreview.js'
import { throwUncoveredError, wait } from '@speckle/shared'
import {
  getHealthCheckFilePath,
  serviceOrigin,
  getPreviewTimeout
} from '@/utils/env.js'
import { DbClients, getDbClients } from '@/clients/knex.js'

let shouldExit = false

export async function startPreviewService() {
  const backgroundLogger = extendLoggerComponent(logger, 'backgroundWorker')
  backgroundLogger.info('📸 Starting Preview Service background worker')

  process.on('SIGTERM', () => {
    shouldExit = true
    backgroundLogger.info('Shutting down...')
  })

  process.on('SIGINT', () => {
    shouldExit = true
    backgroundLogger.info('Shutting down...')
  })

  const dbClients = await getDbClients()

  // TODO, this should also be initialized for all DBs
  initPrometheusMetrics({ db: dbClients.main.public })

  const clientGenerator = infiniteDbClientsIterator(dbClients)

  while (!shouldExit) {
    const db = clientGenerator.next().value
    if (!db) throw new Error('The infinite client generator failed to return a client')

    const status = await pollForAndCreatePreviewFactory({
      updateHealthcheckData: updateHealthcheckDataFactory({
        healthCheckFilePath: getHealthCheckFilePath()
      }),
      getNextUnstartedObjectPreview: getNextUnstartedObjectPreviewFactory({ db }),
      generateAndStore360Preview: generateAndStore360PreviewFactory({
        generatePreview: generatePreviewFactory({
          serviceOrigin: serviceOrigin(),
          timeout: getPreviewTimeout()
        }),
        insertPreview: insertPreviewFactory({ db })
      }),
      updatePreviewMetadata: updatePreviewMetadataFactory({ db }),
      notifyUpdate: notifyUpdateFactory({ db }),
      logger: backgroundLogger
    })()

    switch (status) {
      case WorkStatus.SUCCESS:
        await wait(10)
        break
      case WorkStatus.NOWORKFOUND:
        await wait(1000)
        break
      case WorkStatus.FAILED:
        await wait(5000)
        break
      default:
        throwUncoveredError(status)
    }
  }
  process.exit(0)
}

function* infiniteDbClientsIterator(dbClients: DbClients) {
  let index = 0
  const dbClientEntries = Object.values(dbClients)
  const clientCount = dbClientEntries.length
  while (true) {
    // reset index
    if (index === clientCount) index = 0
    const dbConnection = dbClientEntries[index]
    index++
    yield dbConnection.public
  }
}
