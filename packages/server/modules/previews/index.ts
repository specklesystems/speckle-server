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
import Redis, { RedisOptions } from 'ioredis'
import { createBullBoard } from 'bull-board'
import { BullMQAdapter } from 'bull-board/bullMQAdapter'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import { Roles, TIME } from '@speckle/shared'
import { validateServerRoleBuilderFactory } from '@/modules/shared/authz'
import { getRolesFactory } from '@/modules/shared/repositories/roles'
import { previewRouterFactory } from '@/modules/previews/rest/router'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { previewResultPayload } from '@speckle/shared/dist/commonjs/previews/job.js'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import {
  storePreviewFactory,
  upsertObjectPreviewFactory
} from '@/modules/previews/repository/previews'
import { getObjectCommitsWithStreamIdsFactory } from '@/modules/core/repositories/commits'
import { initializeMetrics } from '@/modules/previews/observability/metrics'

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
  const previewRequestQueue = new Bull('preview-service-jobs', opts)
  // these events are published on the job queue, results come back on the response queue
  previewRequestQueue.on('error', (err) => {
    logger.error({ err }, 'Preview generation failed')
  })
  previewRequestQueue.on('failed', (job, err) => {
    const jobId = 'jobId' in job.data ? job.data.jobId : undefined
    logger.error({ err, jobId }, 'Preview job {jobId} failed.')
  })
  previewRequestQueue.on('active', (job) => {
    const jobId = 'jobId' in job.data ? job.data.jobId : undefined
    logger.info({ jobId }, 'Preview job {jobId} processing started.')
  })
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
      previewRequestQueue
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
        { status: parsedMessage.data.status },
        parsedMessage.data.result.durationSeconds * TIME.second
      )

      done()
    })
  }
}

export const finalize = () => {}
