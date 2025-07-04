/* istanbul ignore file */
import { moduleLogger, previewLogger as logger } from '@/observability/logging'

import {
  disablePreviews,
  getPreviewServiceRedisUrl,
  getRedisUrl
} from '@/modules/shared/helpers/envHelper'
import type { Queue } from 'bull'
import { ensureError } from '@speckle/shared'
import { previewRouterFactory } from '@/modules/previews/rest/router'
import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { initializeMetrics } from '@/modules/previews/observability/metrics'
import { createRequestQueue } from '@/modules/previews/clients/bull'
import {
  requestActiveHandlerFactory,
  requestErrorHandlerFactory,
  requestFailedHandlerFactory
} from '@/modules/previews/queues/previews'
import type { BuildUpdateObjectPreview } from '@/modules/previews/domain/operations'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { updateObjectPreviewFactory } from '@/modules/previews/repository/previews'

const JobQueueName = 'preview-service-jobs'

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

  let previewRequestQueue: Queue

  try {
    previewRequestQueue = await createRequestQueue({
      redisUrl: getPreviewServiceRedisUrl() ?? getRedisUrl(),
      requestQueueName: JobQueueName,
      requestErrorHandler: requestErrorHandlerFactory({ logger }),
      requestFailedHandler: requestFailedHandlerFactory({
        logger,
        buildUpdateObjectPreview: buildUpdateObjectPreviewFunction()
      }),
      requestActiveHandler: requestActiveHandlerFactory({ logger })
    })
  } catch (e) {
    const err = ensureError(e, 'Unknown error when creating preview queues')
    moduleLogger.error({ err }, 'Could not create preview queues. Disabling previews.')
    return
  }

  const { previewJobsProcessedSummary } = initializeMetrics({
    registers: [metricsRegister],
    previewRequestQueue
  })

  const previewRouter = previewRouterFactory({
    previewRequestQueue,
    previewJobsProcessedSummary
  })
  app.use(previewRouter)
}

export const finalize = () => {}
