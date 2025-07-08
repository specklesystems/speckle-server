import cron from 'node-cron'
import { notifyChangeInFileStatus } from '@/modules/fileuploads/services/management'
import { moduleLogger } from '@/observability/logging'
import {
  onFileImportProcessedFactory,
  onFileProcessingFactory,
  parseMessagePayload
} from '@/modules/fileuploads/services/resultListener'
import { publish } from '@/modules/shared/utils/subscriptions'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import {
  getProjectModelByIdFactory,
  getStreamBranchByNameFactory
} from '@/modules/core/repositories/branches'
import {
  getFeatureFlags,
  getRhinoQueuePostgresConnectionString,
  isFileUploadsEnabled
} from '@/modules/shared/helpers/envHelper'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { listenFor } from '@/modules/core/utils/dbNotificationListener'
import { getEventBus } from '@/modules/shared/services/eventBus'
import {
  expireOldPendingUploadsFactory,
  getFileInfoFactory,
  updateFileUploadFactory
} from '@/modules/fileuploads/repositories/fileUploads'
import { db } from '@/db/knex'
import { getFileImportTimeLimitMinutes } from '@/modules/shared/helpers/envHelper'
import { getRegisteredDbClients } from '@/modules/multiregion/utils/dbSelector'
import { scheduleExecutionFactory } from '@/modules/core/services/taskScheduler'
import {
  acquireTaskLockFactory,
  releaseTaskLockFactory
} from '@/modules/core/repositories/scheduledTasks'
import type { ScheduleExecution } from '@/modules/core/domain/scheduledTasks/operations'
import { manageFileImportExpiryFactory } from '@/modules/fileuploads/services/tasks'
import { TIME } from '@speckle/shared'
import { FileUploadDatabaseEvents } from '@/modules/fileuploads/domain/consts'
import { fileuploadRouterFactory } from '@/modules/fileuploads/rest/router'
import { nextGenFileImporterRouterFactory } from '@/modules/fileuploads/rest/nextGenRouter'
import {
  initializeRhinoQueue,
  initializeIfcQueue,
  shutdownQueues,
  fileImportQueues,
  initializePostgresQueue
} from '@/modules/fileuploads/queues/fileimports'
import { initializeEventListenersFactory } from '@/modules/fileuploads/events/eventListener'
import {
  initializeMetrics,
  ObserveResult
} from '@/modules/fileuploads/observability/metrics'
import { reportSubscriptionEventsFactory } from '@/modules/fileuploads/events/subscriptionListeners'
import { configureClient } from '@/knexfile'

const {
  FF_NEXT_GEN_FILE_IMPORTER_ENABLED,
  FF_BACKGROUND_JOBS_ENABLED,
  FF_RHINO_FILE_IMPORTER_ENABLED
} = getFeatureFlags()

let scheduledTasks: cron.ScheduledTask[] = []

const scheduleFileImportExpiry = async ({
  scheduleExecution
}: {
  scheduleExecution: ScheduleExecution
}) => {
  const fileImportExpiryHandlers: ReturnType<typeof manageFileImportExpiryFactory>[] =
    []
  const regionClients = await getRegisteredDbClients()
  for (const projectDb of [db, ...regionClients]) {
    fileImportExpiryHandlers.push(
      manageFileImportExpiryFactory({
        garbageCollectExpiredPendingUploads: expireOldPendingUploadsFactory({
          db: projectDb
        }),
        notifyUploadStatus: notifyChangeInFileStatus({
          eventEmit: getEventBus().emit
        })
      })
    )
  }

  const cronExpression = '*/5 * * * *' // every 5 minutes
  return scheduleExecution(
    cronExpression,
    'FileImportExpiry',
    async (_scheduledTime, { logger }) => {
      await Promise.all(
        fileImportExpiryHandlers.map((handler) =>
          handler({
            logger,
            timeoutThresholdSeconds: (getFileImportTimeLimitMinutes() + 1) * TIME.minute // additional buffer of 1 minute
          })
        )
      )
    }
  )
}

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

  let observeResult: ObserveResult | undefined = undefined

  if (isInitial) {
    // this feature flag is going away soon
    if (FF_NEXT_GEN_FILE_IMPORTER_ENABLED) {
      // this freature flag is going away soon, it will be on by default
      // once we switch stabilize the background jobs mechanism
      if (FF_BACKGROUND_JOBS_ENABLED) {
        const queueInits = [
          initializePostgresQueue({
            label: 'ifc',
            supportedFileTypes: ['ifc'],
            db
          })
        ]

        if (FF_RHINO_FILE_IMPORTER_ENABLED) {
          const connectionUri = getRhinoQueuePostgresConnectionString()
          const rhinoQueueDb = configureClient({ postgres: { connectionUri } })
          queueInits.push(
            initializePostgresQueue({
              label: 'rhino',
              supportedFileTypes: ['obj', 'stl', 'skp'],
              // using public here, as the private uri is not applicable here
              db: rhinoQueueDb.public
            })
          )
        }
        // no need to store the queue refs here for now
        await Promise.all(queueInits)
        //stick to the bull queue based mechanism by default
      } else {
        const queueInits = [initializeIfcQueue()]
        if (FF_RHINO_FILE_IMPORTER_ENABLED) {
          queueInits.push(initializeRhinoQueue())
        }
        const requestQueues = await Promise.all(queueInits)

        ;({ observeResult } = initializeMetrics({
          registers: [metricsRegister],
          requestQueues
        }))
      }
    }

    const scheduleExecution = scheduleExecutionFactory({
      acquireTaskLock: acquireTaskLockFactory({ db }),
      releaseTaskLock: releaseTaskLockFactory({ db })
    })

    scheduledTasks = [await scheduleFileImportExpiry({ scheduleExecution })]

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

    initializeEventListenersFactory({ db })()
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

  if (FF_NEXT_GEN_FILE_IMPORTER_ENABLED) {
    moduleLogger.info('📄 Next Gen File Importer is ENABLED')
    app.use(
      nextGenFileImporterRouterFactory({
        queues: fileImportQueues,
        observeResult: observeResult ?? undefined
      })
    )
  }

  // the two routers can be used independently and can both be enabled
  app.use(fileuploadRouterFactory())
}

export const shutdown: SpeckleModule['shutdown'] = async () => {
  scheduledTasks.forEach((task) => task.stop())
  if (FF_NEXT_GEN_FILE_IMPORTER_ENABLED) {
    await shutdownQueues({ logger: moduleLogger })
  }
}
