import type cron from 'node-cron'
import { moduleLogger } from '@/observability/logging'
import { publish } from '@/modules/shared/utils/subscriptions'
import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { getProjectModelByIdFactory } from '@/modules/core/repositories/branches'
import {
  getFeatureFlags,
  getFileImporterQueuePostgresUrl,
  isFileUploadsEnabled
} from '@/modules/shared/helpers/envHelper'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { db } from '@/db/knex'
import { scheduleExecutionFactory } from '@/modules/core/services/taskScheduler'
import {
  acquireTaskLockFactory,
  releaseTaskLockFactory
} from '@/modules/core/repositories/scheduledTasks'
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
import { scheduleBackgroundJobGarbageCollection } from '@/modules/fileuploads/tasks/garbageCollectBackgroundJobs'

const { FF_RHINO_FILE_IMPORTER_ENABLED } = getFeatureFlags()

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

  let observeResult: ObserveResult | undefined = undefined

  if (isInitial) {
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

    const scheduleExecution = scheduleExecutionFactory({
      acquireTaskLock: acquireTaskLockFactory({ db }),
      releaseTaskLock: releaseTaskLockFactory({ db })
    })

    scheduledTasks.push(
      await scheduleBackgroundJobGarbageCollection({
        queueDb,
        scheduleExecution,
        cronExpression: EveryFiveMinutes
      })
    )

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
  await shutdownQueues({ logger: moduleLogger })
}
