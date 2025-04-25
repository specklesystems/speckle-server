/* istanbul ignore file */
import { moduleLogger, previewLogger as logger } from '@/observability/logging'
import {
  disablePreviews,
  getPreviewServiceRedisUrl,
  getRedisUrl,
  getServerOrigin
} from '@/modules/shared/helpers/envHelper'
import type { Queue } from 'bull'
import { ensureError } from '@speckle/shared'
import { previewRouterFactory } from '@/modules/previews/rest/router'
import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { initializeMetrics } from '@/modules/previews/observability/metrics'
import { responseHandlerFactory } from '@/modules/previews/services/responses'
import { adminRouterFactory } from '@/modules/previews/rest/admin'
import { createRequestAndResponseQueues } from '@/modules/previews/clients/bull'
import { buildConsumePreviewResult } from '@/modules/previews/resultListener'
import {
  requestActiveHandlerFactory,
  requestErrorHandlerFactory,
  requestFailedHandlerFactory
} from '@/modules/previews/queues/previews'
import { buildUpsertObjectPreview } from '@/modules/previews/repository/previews'

const JobQueueName = 'preview-service-jobs'
const ResponseQueueNamePrefix = 'preview-service-results'

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
          buildUpsertObjectPreview: buildUpsertObjectPreview()
        }),
        requestActiveHandler: requestActiveHandlerFactory({ logger })
      }))
  } catch (e) {
    const err = ensureError(e, 'Unknown error when creating preview queues')
    moduleLogger.error({ err }, 'Could not create preview queues. Disabling previews.')
    return
  }

  const { previewJobsProcessedSummary } = initializeMetrics({
    registers: [metricsRegister],
    previewRequestQueue,
    previewResponseQueue
  })

  const adminRouter = adminRouterFactory({
    previewRequestQueue,
    previewResponseQueue
  })
  app.use(adminRouter)

  const previewRouter = previewRouterFactory({
    previewRequestQueue,
    responseQueueName
  })
  app.use(previewRouter)

  void previewResponseQueue.process(
    responseHandlerFactory({
      previewJobsProcessedSummary,
      logger,
      consumePreviewResultBuilder: buildConsumePreviewResult
    })
  )
}

export const finalize = () => {}
