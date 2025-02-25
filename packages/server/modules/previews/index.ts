/* istanbul ignore file */
import { moduleLogger, logger } from '@/logging/logging'
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
import prometheusClient from 'prom-client'

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

export const init: SpeckleModule['init'] = (app, isInitial) => {
  if (isInitial) {
    if (disablePreviews()) {
      moduleLogger.warn('📸 Object preview module is DISABLED')
    } else {
      moduleLogger.info('📸 Init object preview module')
    }

    const responseQueueName = `preview-service-results-${
      new URL(getServerOrigin()).hostname
    }`

    // add a metric to gauge the length of the preview job queue
    new prometheusClient.Gauge({
      name: 'speckle_server_preview_jobs_queue_pending',
      help: 'Number of preview jobs waiting in the job queue',
      async collect() {
        this.set(await previewRequestQueue.count())
      }
    })

    const previewJobsCounter = new prometheusClient.Counter({
      name: 'speckle_server_preview_jobs_count',
      help: 'Total number of preview jobs which have been requested to be processed.'
    })
    const previewJobsFailedCounter = new prometheusClient.Counter({
      name: 'speckle_server_preview_jobs_request_failed_count',
      help: 'Total number of preview jobs which have been requested but failed to be processed.'
    })
    const previewJobsResponseCounter = new prometheusClient.Counter<'status'>({
      name: 'speckle_server_preview_jobs_response_count',
      help: 'Number of preview jobs which have been responded to, and their status (success or error)',
      labelNames: ['status']
    })
    const previewJobsProcessedHistogram = new prometheusClient.Histogram({
      name: 'speckle_server_preview_jobs_processed_duration_seconds',
      help: 'Duration of preview job processing',
      labelNames: ['status'],
      buckets: [
        10 * TIME.second,
        30 * TIME.second,
        1 * TIME.minute,
        3 * TIME.minute,
        15 * TIME.minute,
        30 * TIME.minute,
        60 * TIME.minute
      ]
    })

    const { previewRequestQueue, previewResponseQueue } = getPreviewQueues({
      responseQueueName
    })

    previewRequestQueue.on('added', () => {
      previewJobsCounter.inc()
    })
    previewRequestQueue.on('failed', () => {
      previewJobsFailedCounter.inc()
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

      previewJobsResponseCounter.inc({ status: parsedMessage.data.status })
      if (parsedMessage.data.status === 'success') {
        previewJobsProcessedHistogram.observe(
          { status: parsedMessage.data.status },
          parsedMessage.data.result.duration * TIME.second //FIXME is this milliseconds or seconds? Assuming seconds
        )
        //TODO error status responses do not have a duration, but probably should - useful to know if the error was immediate or after a long time
      }
      done()
    })
  }
}

export const finalize = () => {}
