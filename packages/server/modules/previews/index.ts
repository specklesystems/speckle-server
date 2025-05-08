/* istanbul ignore file */
import { moduleLogger, previewLogger as logger } from '@/observability/logging'
import { consumePreviewResultFactory } from '@/modules/previews/resultListener'

import { db } from '@/db/knex'
import {
  disablePreviews,
  getPreviewServiceRedisUrl,
  getRedisUrl,
  getServerOrigin
} from '@/modules/shared/helpers/envHelper'
import { createBullBoard } from 'bull-board'
import { BullMQAdapter } from 'bull-board/bullMQAdapter'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import { ensureError, Roles, TIME } from '@speckle/shared'
import { validateServerRoleBuilderFactory } from '@/modules/shared/authz'
import { getRolesFactory } from '@/modules/shared/repositories/roles'
import { previewRouterFactory } from '@/modules/previews/rest/router'
import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import {
  JobPayload,
  PreviewResultPayload,
  previewResultPayload
} from '@speckle/shared/dist/commonjs/previews/job.js'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import {
  storePreviewFactory,
  upsertObjectPreviewFactory
} from '@/modules/previews/repository/previews'
import { getObjectCommitsWithStreamIdsFactory } from '@/modules/core/repositories/commits'
import {
  initializeMetrics,
  PreviewJobDurationStep
} from '@/modules/previews/observability/metrics'
import { addRequestQueueListeners } from '@/modules/previews/queues/previews'
import { initializeQueue } from '@speckle/shared/dist/commonjs/queue'
import Bull from 'bull'

const JobQueueName = 'preview-service-jobs'
const ResponseQueueNamePrefix = 'preview-service-results'

const getPreviewQueues = async (params: { responseQueueName: string }) => {
  const { responseQueueName } = params
  const redisUrl = getPreviewServiceRedisUrl() ?? getRedisUrl()

  // previews are requested on this queue
  const previewRequestQueue = await initializeQueue<JobPayload>({
    queueName: JobQueueName,
    redisUrl
  })
  addRequestQueueListeners({
    logger,
    previewRequestQueue
  })

  // rendered previews are sent back on this queue
  const previewResponseQueue = await initializeQueue<PreviewResultPayload>({
    queueName: responseQueueName,
    redisUrl
  })

  return { previewRequestQueue, previewResponseQueue }
}

export const init: SpeckleModule['init'] = async ({
  app,
  isInitial,
  metricsRegister
}) => {
  if (isInitial) {
    if (disablePreviews()) {
      moduleLogger.warn('📸 Object preview module is DISABLED')
    } else {
      moduleLogger.info('📸 Init object preview module')
    }

    const responseQueueName = `${ResponseQueueNamePrefix}-${
      new URL(getServerOrigin()).hostname
    }`

    let previewRequestQueue: Bull.Queue<JobPayload>
    let previewResponseQueue: Bull.Queue<PreviewResultPayload>

    try {
      ;({ previewRequestQueue, previewResponseQueue } = await getPreviewQueues({
        responseQueueName
      }))
    } catch (e) {
      const err = ensureError(e, 'Unknown error when creating preview queues')
      moduleLogger.error(
        { err },
        'Could not create preview queues. Disabling previews.'
      )
      return
    }

    const { previewJobsProcessedSummary } = initializeMetrics({
      registers: [metricsRegister],
      previewRequestQueue,
      previewResponseQueue
    })

    const router = createBullBoard([
      new BullMQAdapter(previewRequestQueue),
      new BullMQAdapter(previewResponseQueue)
    ]).router
    app.use(
      '/api/admin/preview-jobs',
      async (req, res, next) => {
        await authMiddlewareCreator([
          validateServerRoleBuilderFactory({ getRoles: getRolesFactory({ db }) })({
            requiredRole: Roles.Server.Admin
          })
        ])(req, res, next)
      },
      router
    )

    const previewRouter = previewRouterFactory({
      previewRequestQueue,
      responseQueueName
    })
    app.use(previewRouter)

    void previewResponseQueue.process(async (payload, done) => {
      const { attemptsMade } = payload
      const parsedMessage = previewResultPayload
        .refine((data) => data.jobId.split('.').length === 2, {
          message: 'jobId must be in the format "projectId.objectId"'
        })
        .transform((data) => ({
          ...data,
          projectId: data.jobId.split('.')[0],
          objectId: data.jobId.split('.')[1]
        }))
        .safeParse(payload.data)
      if (!parsedMessage.success) {
        logger.error(
          { payload: payload.data, reason: parsedMessage.error },
          'Failed to parse previewResult payload'
        )

        // as we can't parse the response we neither have a job ID nor a duration,
        // we cannot get a duration to populate previewJobsProcessedSummary.observe

        done(parsedMessage.error)
        return
      }
      const parsedResult = parsedMessage.data
      const { projectId, objectId } = parsedResult
      const jobLogger = logger.child({
        projectId,
        objectId,
        responsePriorAttemptsMade: attemptsMade
      })

      const projectDb = await getProjectDbClient({ projectId })
      await consumePreviewResultFactory({
        logger: jobLogger,
        storePreview: storePreviewFactory({ db: projectDb }),
        upsertObjectPreview: upsertObjectPreviewFactory({ db: projectDb }),
        getObjectCommitsWithStreamIds: getObjectCommitsWithStreamIdsFactory({
          db: projectDb
        })
      })({
        projectId,
        objectId,
        previewResult: parsedResult
      })

      previewJobsProcessedSummary.observe(
        { status: parsedResult.status, step: PreviewJobDurationStep.TOTAL },
        parsedResult.result.durationSeconds * TIME.second
      )
      if (parsedResult.result.loadDurationSeconds) {
        previewJobsProcessedSummary.observe(
          { status: parsedResult.status, step: PreviewJobDurationStep.LOAD },
          parsedResult.result.loadDurationSeconds * TIME.second
        )
      }
      if (parsedResult.result.renderDurationSeconds) {
        previewJobsProcessedSummary.observe(
          { status: parsedResult.status, step: PreviewJobDurationStep.RENDER },
          parsedResult.result.renderDurationSeconds * TIME.second
        )
      }

      done()
    })
  }
}

export const finalize = () => {}
