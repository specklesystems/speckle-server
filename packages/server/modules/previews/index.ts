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
import { Roles } from '@speckle/shared'
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

const getPreviewQueues = ({ responseQueueName }: { responseQueueName: string }) => {
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
  const previewResponseQueue = new Bull(responseQueueName, opts)
  return { previewRequestQueue, previewResponseQueue }
}

export const init: SpeckleModule['init'] = (app, isInitial) => {
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

  const previewRouter = previewRouterFactory({ previewRequestQueue, responseQueueName })
  app.use(previewRouter)

  if (isInitial) {
    previewResponseQueue.process(async (payload, done) => {
      const parsedMessage = previewResultPayload.safeParse(payload.data)
      if (!parsedMessage.success) {
        logger.error(
          { payload: payload.data, reason: parsedMessage.error },
          'Failed to parse previewResult payload'
        )
        done(parsedMessage.error)
      } else {
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
      }
    })
  }
}

export const finalize = () => {}
