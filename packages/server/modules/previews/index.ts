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
import Bull from 'bull'
import Redis, { type RedisOptions } from 'ioredis'
import { createBullBoard } from 'bull-board'
import { BullMQAdapter } from 'bull-board/bullMQAdapter'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import { Roles, TIME } from '@speckle/shared'
import { validateServerRoleBuilderFactory } from '@/modules/shared/authz'
import { getRolesFactory } from '@/modules/shared/repositories/roles'
import { previewRouterFactory } from '@/modules/previews/rest/router'
import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { previewResultPayload } from '@speckle/shared/dist/commonjs/previews/job.js'
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

const getPreviewQueues = (params: { responseQueueName: string }) => {
  const { responseQueueName } = params
  let client: Redis
  let subscriber: Redis
  const redisUrl = getPreviewServiceRedisUrl() ?? getRedisUrl()

  const opts = {
    // redisOpts here will contain at least a property of connectionName which will identify the queue based on its name
    createClient(type: string, redisOpts: RedisOptions) {
      switch (type) {
        case 'client':
          if (!client) {
            client = new Redis(redisUrl, redisOpts)
          }
          return client
        case 'subscriber':
          if (!subscriber) {
            subscriber = new Redis(redisUrl, {
              ...redisOpts,
              maxRetriesPerRequest: null,
              enableReadyCheck: false
            })
          }
          return subscriber
        case 'bclient':
          return new Redis(redisUrl, {
            ...redisOpts,
            maxRetriesPerRequest: null,
            enableReadyCheck: false
          })
        default:
          throw new Error('Unexpected connection type: ' + type)
      }
    }
  }

  // previews are requested on this queue
  const previewRequestQueue = new Bull('preview-service-jobs', opts)
  addRequestQueueListeners({
    logger,
    previewRequestQueue
  })

  // rendered previews are sent back on this queue
  const previewResponseQueue = new Bull(responseQueueName, opts)
  return { previewRequestQueue, previewResponseQueue }
}

export const init: SpeckleModule['init'] = ({ app, isInitial, metricsRegister }) => {
  if (isInitial) {
    if (disablePreviews()) {
      moduleLogger.warn('📸 Object preview module is DISABLED')
    } else {
      moduleLogger.info('📸 Init object preview module')
    }

    const responseQueueName = `preview-service-results-${
      new URL(getServerOrigin()).hostname
    }`

    const { previewRequestQueue, previewResponseQueue } = getPreviewQueues({
      responseQueueName
    })

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

    previewResponseQueue.process(async (payload, done) => {
      const parsedMessage = previewResultPayload.safeParse(payload.data)
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
      const [projectId, objectId] = parsedMessage.data.jobId.split('.')

      const projectDb = await getProjectDbClient({ projectId })
      await consumePreviewResultFactory({
        logger,
        storePreview: storePreviewFactory({ db: projectDb }),
        upsertObjectPreview: upsertObjectPreviewFactory({ db: projectDb }),
        getObjectCommitsWithStreamIds: getObjectCommitsWithStreamIdsFactory({
          db: projectDb
        })
      })({
        projectId,
        objectId,
        previewResult: parsedMessage.data
      })

      previewJobsProcessedSummary.observe(
        { status: parsedMessage.data.status, step: PreviewJobDurationStep.TOTAL },
        parsedMessage.data.result.durationSeconds * TIME.second
      )
      if (parsedMessage.data.result.loadDurationSeconds) {
        previewJobsProcessedSummary.observe(
          { status: parsedMessage.data.status, step: PreviewJobDurationStep.LOAD },
          parsedMessage.data.result.loadDurationSeconds * TIME.second
        )
      }
      if (parsedMessage.data.result.renderDurationSeconds) {
        previewJobsProcessedSummary.observe(
          { status: parsedMessage.data.status, step: PreviewJobDurationStep.RENDER },
          parsedMessage.data.result.renderDurationSeconds * TIME.second
        )
      }

      done()
    })
  }
}

export const finalize = () => {}
