/* istanbul ignore file */
import cron from 'node-cron'
import { moduleLogger, previewLogger as logger } from '@/observability/logging'
import { consumePreviewResultFactory } from '@/modules/previews/resultListener'

import { db } from '@/db/knex'
import {
  disablePreviews,
  getFeatureFlags,
  getPreviewServiceRedisUrl,
  getPrivateObjectsServerOrigin,
  getRedisUrl,
  getServerOrigin,
  previewServiceShouldUsePrivateObjectsServerUrl
} from '@/modules/shared/helpers/envHelper'
import Bull, { type Queue, type QueueOptions } from 'bull'
import Redis, { type RedisOptions } from 'ioredis'
import { createBullBoard } from 'bull-board'
import { BullMQAdapter } from 'bull-board/bullMQAdapter'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import { ensureError, Roles, TIME } from '@speckle/shared'
import { validateServerRoleBuilderFactory } from '@/modules/shared/authz'
import { getRolesFactory } from '@/modules/shared/repositories/roles'
import { previewRouterFactory } from '@/modules/previews/rest/router'
import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { previewResultPayload } from '@speckle/shared/dist/commonjs/previews/job.js'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import {
  getPaginatedObjectPreviewsPageFactory,
  getPaginatedObjectPreviewsTotalCountFactory,
  storePreviewFactory,
  upsertObjectPreviewFactory
} from '@/modules/previews/repository/previews'
import { getObjectCommitsWithStreamIdsFactory } from '@/modules/core/repositories/commits'
import {
  initializeMetrics,
  PreviewJobDurationStep
} from '@/modules/previews/observability/metrics'
import {
  addRequestQueueListeners,
  requestObjectPreviewFactory
} from '@/modules/previews/queues/previews'
import { scheduleExecutionFactory } from '@/modules/core/services/taskScheduler'
import {
  acquireTaskLockFactory,
  releaseTaskLockFactory
} from '@/modules/core/repositories/scheduledTasks'
import type { ScheduleExecution } from '@/modules/core/domain/scheduledTasks/operations'
import { getRegisteredDbClients } from '@/modules/multiregion/utils/dbSelector'
import {
  getPaginatedObjectPreviewInErrorStateFactory,
  retryFailedPreviewsFactory
} from '@/modules/previews/services/tasks'
import { getStreamCollaboratorsFactory } from '@/modules/core/repositories/streams'
import { createAppTokenFactory } from '@/modules/core/services/tokens'
import {
  storeApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeTokenScopesFactory,
  storeUserServerAppTokenFactory
} from '@/modules/core/repositories/tokens'

const { FF_RETRY_ERRORED_PREVIEWS_ENABLED } = getFeatureFlags()

let scheduledTasks: cron.ScheduledTask[] = []

const scheduleRetryFailedPreviews = async ({
  scheduleExecution,
  previewRequestQueue,
  responseQueueName
}: {
  scheduleExecution: ScheduleExecution
  previewRequestQueue: Queue
  responseQueueName: string
}) => {
  let previewResurrectionHandlers: {
    handler: ReturnType<typeof retryFailedPreviewsFactory>
    cursor: string | null
  }[] = []
  const regionClients = await getRegisteredDbClients()
  for (const projectDb of [db, ...regionClients]) {
    previewResurrectionHandlers.push({
      handler: retryFailedPreviewsFactory({
        getPaginatedObjectPreviewsInErrorState:
          getPaginatedObjectPreviewInErrorStateFactory({
            getPaginatedObjectPreviewsPage: getPaginatedObjectPreviewsPageFactory({
              db: projectDb
            }),
            getPaginatedObjectPreviewsTotalCount:
              getPaginatedObjectPreviewsTotalCountFactory({
                db: projectDb
              })
          }),
        upsertObjectPreview: upsertObjectPreviewFactory({
          db: projectDb
        }),
        requestObjectPreview: requestObjectPreviewFactory({
          queue: previewRequestQueue,
          responseQueue: responseQueueName
        }),
        serverOrigin: previewServiceShouldUsePrivateObjectsServerUrl()
          ? getPrivateObjectsServerOrigin()
          : getServerOrigin(),
        getStreamCollaborators: getStreamCollaboratorsFactory({ db }),
        createAppToken: createAppTokenFactory({
          storeApiToken: storeApiTokenFactory({ db }),
          storeTokenScopes: storeTokenScopesFactory({ db }),
          storeTokenResourceAccessDefinitions:
            storeTokenResourceAccessDefinitionsFactory({
              db
            }),
          storeUserServerAppToken: storeUserServerAppTokenFactory({ db })
        })
      }),
      cursor: null
    })
  }

  const cronExpression = '*/5 * * * *' // every 5 minutes
  return scheduleExecution(
    cronExpression,
    'PreviewResurrection',
    async (_scheduledTime, { logger }) => {
      previewResurrectionHandlers = await Promise.all(
        previewResurrectionHandlers.map(async ({ handler, cursor }) => {
          const newCursor = await handler({
            logger,
            previousCursor: cursor
          })
          return { handler, cursor: newCursor.cursor }
        })
      )
    }
  )
}
import { isRedisReady } from '@/modules/shared/redis/redis'

const JobQueueName = 'preview-service-jobs'
const ResponseQueueNamePrefix = 'preview-service-results'

const getPreviewQueues = async (params: { responseQueueName: string }) => {
  const { responseQueueName } = params
  let client: Redis
  let subscriber: Redis
  const redisUrl = getPreviewServiceRedisUrl() ?? getRedisUrl()

  const opts: QueueOptions = {
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
  const previewRequestQueue = new Bull(JobQueueName, opts)
  await isRedisReady(previewRequestQueue.client)
  addRequestQueueListeners({
    logger,
    previewRequestQueue
  })

  // rendered previews are sent back on this queue
  const previewResponseQueue = new Bull(responseQueueName, opts)

  await isRedisReady(previewResponseQueue.client)
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

    const scheduleExecution = scheduleExecutionFactory({
      acquireTaskLock: acquireTaskLockFactory({ db }),
      releaseTaskLock: releaseTaskLockFactory({ db })
    })

    const responseQueueName = `${ResponseQueueNamePrefix}-${
      new URL(getServerOrigin()).hostname
    }`

    let previewRequestQueue: Bull.Queue
    let previewResponseQueue: Bull.Queue

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

    scheduledTasks = [
      ...(FF_RETRY_ERRORED_PREVIEWS_ENABLED
        ? [
            await scheduleRetryFailedPreviews({
              scheduleExecution,
              previewRequestQueue,
              responseQueueName
            })
          ]
        : [])
    ]

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

export const shutdown: SpeckleModule['shutdown'] = async () => {
  scheduledTasks.forEach((task) => {
    task.stop()
  })
}
