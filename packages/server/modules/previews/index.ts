/* istanbul ignore file */
import type cron from 'node-cron'
import { moduleLogger, previewLogger as logger } from '@/observability/logging'
import { buildConsumePreviewResult } from '@/modules/previews/resultListener'
import {
  disablePreviews,
  getFeatureFlags,
  getPreviewServiceRedisUrl,
  getPreviewServiceRetryPeriodMinutes,
  getRedisUrl,
  getServerOrigin
} from '@/modules/shared/helpers/envHelper'
import type { Queue } from 'bull'
import { ensureError } from '@speckle/shared'
import { previewRouterFactory } from '@/modules/previews/rest/router'
import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import {
  initializeMetrics,
  observeMetricsFactory
} from '@/modules/previews/observability/metrics'
import {
  requestActiveHandlerFactory,
  requestErrorHandlerFactory,
  requestFailedHandlerFactory
} from '@/modules/previews/queues/previews'
import { scheduleExecutionFactory } from '@/modules/core/services/taskScheduler'
import {
  acquireTaskLockFactory,
  releaseTaskLockFactory
} from '@/modules/core/repositories/scheduledTasks'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { db } from '@/db/knex'
import { createRequestAndResponseQueues } from '@/modules/previews/clients/bull'
import { responseHandlerFactory } from '@/modules/previews/services/responses'
import { updateObjectPreviewFactory } from '@/modules/previews/repository/previews'
import type { BuildUpdateObjectPreview } from '@/modules/previews/domain/operations'
import { scheduleRetryFailedPreviews } from '@/modules/previews/tasks/tasks'

const { FF_RETRY_ERRORED_PREVIEWS_ENABLED } = getFeatureFlags()

let scheduledTasks: cron.ScheduledTask[] = []

const JobQueueName = 'preview-service-jobs'
const ResponseQueueNamePrefix = 'preview-service-results'

const buildUpdateObjectPreviewFunction =
  (): BuildUpdateObjectPreview => async (params) => {
    const { projectId } = params
    const projectDb = await getProjectDbClient({ projectId })
    return updateObjectPreviewFactory({ db: projectDb })
  }

export const init: SpeckleModule['init'] = async ({
  app,
  isInitial,
  metricsRegister
}) => {
  if (!isInitial) return

  if (disablePreviews()) {
    moduleLogger.warn('📸 Object preview module is DISABLED')
    return
  } else {
    moduleLogger.info('📸 Init object preview module')
  }

  const scheduleExecution = scheduleExecutionFactory({
    acquireTaskLock: acquireTaskLockFactory({ db }),
    releaseTaskLock: releaseTaskLockFactory({ db })
  })

  const responseQueueName = `${ResponseQueueNamePrefix}-${
    new URL(getServerOrigin()).hostname
  }`

  let previewRequestQueue: Queue
  let previewResponseQueue: Queue

  try {
    ;({ requestQueue: previewRequestQueue, responseQueue: previewResponseQueue } =
      await createRequestAndResponseQueues({
        redisUrl: getPreviewServiceRedisUrl() ?? getRedisUrl(),
        requestQueueName: JobQueueName,
        responseQueueName,
        requestErrorHandler: requestErrorHandlerFactory({ logger }),
        requestFailedHandler: requestFailedHandlerFactory({
          logger,
          buildUpdateObjectPreview: buildUpdateObjectPreviewFunction()
        }),
        requestActiveHandler: requestActiveHandlerFactory({ logger })
      }))
  } catch (e) {
    const err = ensureError(e, 'Unknown error when creating preview queues')
    moduleLogger.error({ err }, 'Could not create preview queues. Disabling previews.')
    return
  }

  scheduledTasks = [
    ...(FF_RETRY_ERRORED_PREVIEWS_ENABLED
      ? [
          await scheduleRetryFailedPreviews({
            scheduleExecution,
            previewRequestQueue,
            responseQueueName,
            cronExpression: `*/${getPreviewServiceRetryPeriodMinutes()} * * * *`
          })
        ]
      : [])
  ]

  const { previewJobsProcessedSummary } = initializeMetrics({
    registers: [metricsRegister],
    previewRequestQueue,
    previewResponseQueue
  })

  const previewRouter = previewRouterFactory({
    previewRequestQueue,
    responseQueueName
  })
  app.use(previewRouter)

  void previewResponseQueue.process(
    responseHandlerFactory({
      observeMetrics: observeMetricsFactory({ summary: previewJobsProcessedSummary }),
      logger,
      consumePreviewResultBuilder: buildConsumePreviewResult
    })
  )
}

export const finalize = () => {}

export const shutdown: SpeckleModule['shutdown'] = async () => {
  scheduledTasks.forEach((task) => {
    task.stop()
  })
}
