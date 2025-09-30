import type cron from 'node-cron'
import { moduleLogger } from '@/observability/logging'
import {
  onFileImportProcessedFactory,
  onFileProcessingFactory,
  parseMessagePayload
} from '@/modules/fileuploads/services/resultListener'
import { publish } from '@/modules/shared/utils/subscriptions'
import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import {
  getProjectModelByIdFactory,
  getStreamBranchByNameFactory
} from '@/modules/core/repositories/branches'
import {
  getFeatureFlags,
  getFileImporterQueuePostgresUrl,
  isFileUploadsEnabled
} from '@/modules/shared/helpers/envHelper'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { listenFor } from '@/modules/core/utils/dbNotificationListener'
import { getEventBus } from '@/modules/shared/services/eventBus'
import {
  getFileInfoFactory,
  updateFileUploadFactory
} from '@/modules/fileuploads/repositories/fileUploads'
import { db } from '@/db/knex'
import { scheduleExecutionFactory } from '@/modules/core/services/taskScheduler'
import {
  acquireTaskLockFactory,
  releaseTaskLockFactory
} from '@/modules/core/repositories/scheduledTasks'
import { FileUploadDatabaseEvents } from '@/modules/fileuploads/domain/consts'
import { fileuploadRouterFactory } from '@/modules/fileuploads/rest/router'
import {
  shutdownQueues,
  initializePostgresQueue
} from '@/modules/fileuploads/queues/fileimports'
import { initializeEventListenersFactory } from '@/modules/fileuploads/events/eventListener'
import type { ObserveResult } from '@/modules/fileuploads/observability/metrics'
import { initializeMetrics } from '@/modules/fileuploads/observability/metrics'
import { reportSubscriptionEventsFactory } from '@/modules/fileuploads/events/subscriptionListeners'
import { configureClient } from '@/knexfile'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { rhinoImporterSupportedFileExtensions } from '@speckle/shared/blobs'
import { scheduleFileImportExpiry } from '@/modules/fileuploads/tasks/expireFileImports'
import { scheduleBackgroundJobGarbageCollection } from '@/modules/fileuploads/tasks/garbageCollectBackgroundJobs'

const { FF_NEXT_GEN_FILE_IMPORTER_ENABLED, FF_RHINO_FILE_IMPORTER_ENABLED } =
  getFeatureFlags()

const EveryMinute = '*/1 * * * *'
const EveryFiveMinutes = '*/5 * * * *'

const scheduledTasks: cron.ScheduledTask[] = []

export const init: SpeckleModule['init'] = async ({
  app,
  isInitial,
  metricsRegister
}) => {
  if (!isFileUploadsEnabled()) {
    moduleLogger.warn('📄 FileUploads module is DISABLED')
    return
  }
  moduleLogger.info('📄 Init FileUploads module')

  if (FF_NEXT_GEN_FILE_IMPORTER_ENABLED)
    moduleLogger.info('📄 Next Gen File Importer is ENABLED')

  const scheduleExecution = scheduleExecutionFactory({
    acquireTaskLock: acquireTaskLockFactory({ db }),
    releaseTaskLock: releaseTaskLockFactory({ db })
  })

  let observeResult: ObserveResult | undefined = undefined

  if (isInitial) {
    if (FF_NEXT_GEN_FILE_IMPORTER_ENABLED) {
      moduleLogger.info('🗳️ Next Gen File importer is ENABLED')
      const connectionUri = getFileImporterQueuePostgresUrl()
      const queueDb = connectionUri
        ? configureClient({ postgres: { connectionUri } }).public
        : db
      const requestQueues = [
        await initializePostgresQueue({
          label: 'ifc',
          supportedFileTypes: ['ifc'],
          db: queueDb
        })
      ]
      if (FF_RHINO_FILE_IMPORTER_ENABLED) {
        moduleLogger.info('🦏 Rhino File Importer is ENABLED')
        if (!connectionUri)
          throw new MisconfiguredEnvironmentError(
            'Need a dedicated queue for Rhino based fileimports'
          )
        requestQueues.push(
          await initializePostgresQueue({
            label: 'rhino',
            supportedFileTypes: [...rhinoImporterSupportedFileExtensions],
            // using public here, as the private uri is not applicable here
            db: queueDb
          })
        )
      }
      ;({ observeResult } = initializeMetrics({
        registers: [metricsRegister],
        requestQueues
      }))

      scheduledTasks.push(
        await scheduleBackgroundJobGarbageCollection({
          queueDb,
          scheduleExecution,
          cronExpression: EveryFiveMinutes
        })
      )
    } else {
      // feature flag is not enabled
      scheduledTasks.push(
        await scheduleFileImportExpiry({
          scheduleExecution,
          cronExpression: EveryMinute
        })
      )

      await listenFor(FileUploadDatabaseEvents.Updated, async (msg) => {
        const parsedMessage = parseMessagePayload(msg.payload)
        if (!parsedMessage.streamId) return
        const projectDb = await getProjectDbClient({
          projectId: parsedMessage.streamId
        })

        await onFileImportProcessedFactory({
          getFileInfo: getFileInfoFactory({ db: projectDb }),
          getStreamBranchByName: getStreamBranchByNameFactory({ db: projectDb }),
          updateFileUpload: updateFileUploadFactory({ db: projectDb }),
          eventEmit: getEventBus().emit
        })(parsedMessage)
      })

      await listenFor(FileUploadDatabaseEvents.Started, async (msg) => {
        const parsedMessage = parseMessagePayload(msg.payload)
        if (!parsedMessage.streamId) return
        const projectDb = await getProjectDbClient({
          projectId: parsedMessage.streamId
        })
        await onFileProcessingFactory({
          getFileInfo: getFileInfoFactory({ db: projectDb }),
          emitEvent: getEventBus().emit
        })(parsedMessage)
      })
    }

    initializeEventListenersFactory({ db, observeResult })()
    reportSubscriptionEventsFactory({
      publish,
      eventListen: getEventBus().listen,
      getProjectModelById: async (params) => {
        const projectDb = await getProjectDbClient({
          projectId: params.projectId
        })
        return getProjectModelByIdFactory({ db: projectDb })(params)
      }
    })()
  }

  app.use(fileuploadRouterFactory())
}

export const shutdown: SpeckleModule['shutdown'] = async () => {
  scheduledTasks.forEach((task) => task.stop())
  if (FF_NEXT_GEN_FILE_IMPORTER_ENABLED) {
    await shutdownQueues({ logger: moduleLogger })
  }
}
