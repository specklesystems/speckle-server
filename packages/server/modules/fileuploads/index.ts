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
import { getStreamBranchByNameFactory } from '@/modules/core/repositories/branches'
import {
  getFeatureFlags,
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
import { Optional, Roles, TIME } from '@speckle/shared'
import { FileUploadDatabaseEvents } from '@/modules/fileuploads/domain/consts'
import { fileuploadRouterFactory } from '@/modules/fileuploads/rest/router'
import { nextGenFileImporterRouterFactory } from '@/modules/fileuploads/rest/nextGenRouter'
import {
  initializeQueue,
  shutdownQueue
} from '@/modules/fileuploads/queues/fileimports'
import { initializeEventListenersFactory } from '@/modules/fileuploads/events/eventListener'
import { createBullBoard } from 'bull-board'
import { BullMQAdapter } from 'bull-board/bullMQAdapter'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import { getRolesFactory } from '@/modules/shared/repositories/roles'
import { validateServerRoleBuilderFactory } from '@/modules/shared/authz'

const { FF_NEXT_GEN_FILE_IMPORTER_ENABLED } = getFeatureFlags()

let quitListeners: Optional<() => void> = undefined
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
          getStreamBranchByName: getStreamBranchByNameFactory({ db: projectDb }),
          publish
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

export const init: SpeckleModule['init'] = async ({ app, isInitial }) => {
  if (!isFileUploadsEnabled()) {
    moduleLogger.warn('📄 FileUploads module is DISABLED')
    return
  }
  moduleLogger.info('📄 Init FileUploads module')
  if (FF_NEXT_GEN_FILE_IMPORTER_ENABLED) {
    moduleLogger.info('📄 Next Gen File Importer is ENABLED')
    app.use(nextGenFileImporterRouterFactory())
  }

  // the two routers can be used independently and can both be enabled
  app.use(fileuploadRouterFactory())

  if (isInitial) {
    if (FF_NEXT_GEN_FILE_IMPORTER_ENABLED) {
      const queue = await initializeQueue()
      const router = createBullBoard([new BullMQAdapter(queue)]).router
      app.use(
        '/api/admin/fileimport-jobs',
        async (req, res, next) => {
          await authMiddlewareCreator([
            validateServerRoleBuilderFactory({ getRoles: getRolesFactory({ db }) })({
              requiredRole: Roles.Server.Admin
            })
          ])(req, res, next)
        },
        router
      )
    }
    const scheduleExecution = scheduleExecutionFactory({
      acquireTaskLock: acquireTaskLockFactory({ db }),
      releaseTaskLock: releaseTaskLockFactory({ db })
    })

    scheduledTasks = [await scheduleFileImportExpiry({ scheduleExecution })]

    // if (!FF_NEXT_GEN_FILE_IMPORTER_ENABLED) {
    listenFor(FileUploadDatabaseEvents.Updated, async (msg) => {
      const parsedMessage = parseMessagePayload(msg.payload)
      if (!parsedMessage.streamId) return
      const projectDb = await getProjectDbClient({
        projectId: parsedMessage.streamId
      })
      await onFileImportProcessedFactory({
        getFileInfo: getFileInfoFactory({ db: projectDb }),
        publish,
        getStreamBranchByName: getStreamBranchByNameFactory({ db: projectDb }),
        updateFileUpload: updateFileUploadFactory({ db: projectDb }),
        eventEmit: getEventBus().emit
      })(parsedMessage)
    })
    listenFor(FileUploadDatabaseEvents.Started, async (msg) => {
      const parsedMessage = parseMessagePayload(msg.payload)
      if (!parsedMessage.streamId) return
      const projectDb = await getProjectDbClient({
        projectId: parsedMessage.streamId
      })
      await onFileProcessingFactory({
        getFileInfo: getFileInfoFactory({ db: projectDb }),
        publish
      })(parsedMessage)
    })
    // }

    quitListeners = initializeEventListenersFactory({ db })()
  }
}

export const shutdown: SpeckleModule['shutdown'] = async () => {
  quitListeners?.()
  scheduledTasks.forEach((task) => task.stop())
  if (FF_NEXT_GEN_FILE_IMPORTER_ENABLED) await shutdownQueue()
}
