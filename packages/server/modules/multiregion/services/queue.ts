import Bull from 'bull'
import { logger } from '@/observability/logging'
import { isProdEnv, isTestEnv } from '@/modules/shared/helpers/envHelper'
import cryptoRandomString from 'crypto-random-string'
import { Optional } from '@speckle/shared'
import { buildBaseQueueOptions } from '@/modules/shared/helpers/bullHelper'
import { UninitializedResourceAccessError } from '@/modules/shared/errors'
import {
  MultiRegionInvalidJobError,
  MultiRegionNotYetImplementedError
} from '@/modules/multiregion/errors'
import { getProjectDbClient, getRegionDb } from '@/modules/multiregion/utils/dbSelector'
import {
  getProjectObjectStorage,
  getRegionObjectStorage
} from '@/modules/multiregion/utils/blobStorageSelector'
import {
  updateProjectRegionFactory,
  validateProjectRegionCopyFactory
} from '@/modules/workspaces/services/projectRegions'
import { db } from '@/db/knex'
import { getProjectFactory } from '@/modules/core/repositories/projects'
import { getAvailableRegionsFactory } from '@/modules/workspaces/services/regions'
import { getRegionsFactory } from '@/modules/multiregion/repositories'
import { canWorkspaceUseRegionsFactory } from '@/modules/gatekeeper/services/featureAuthorization'
import { getProjectAutomationsTotalCountFactory } from '@/modules/automate/repositories/automations'
import { getStreamCommentCountFactory } from '@/modules/comments/repositories/comments'
import { getStreamBranchCountFactory } from '@/modules/core/repositories/branches'
import { getStreamCommitCountFactory } from '@/modules/core/repositories/commits'
import { getStreamObjectCountFactory } from '@/modules/core/repositories/objects'
import { getWorkspacePlanFactory } from '@/modules/gatekeeper/repositories/billing'
import {
  upsertProjectRegionKeyFactory,
  deleteRegionKeyFromCacheFactory
} from '@/modules/multiregion/repositories/projectRegion'
import { updateProjectRegionKeyFactory } from '@/modules/multiregion/services/projectRegion'
import { getGenericRedis } from '@/modules/shared/redis/redis'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { getStreamWebhooksFactory } from '@/modules/webhooks/repositories/webhooks'
import {
  copyWorkspaceFactory,
  copyProjectsFactory,
  copyProjectModelsFactory,
  copyProjectVersionsFactory,
  copyProjectObjectsFactory,
  copyProjectAutomationsFactory,
  copyProjectCommentsFactory,
  copyProjectWebhooksFactory,
  copyProjectBlobs
} from '@/modules/workspaces/repositories/projectRegions'
import { withTransaction } from '@/modules/shared/helpers/dbHelper'

const MULTIREGION_QUEUE_NAME = isTestEnv()
  ? `test:multiregion:${cryptoRandomString({ length: 5 })}`
  : 'default:multiregion'

if (isTestEnv()) {
  logger.info(`Multiregion test queue ID: ${MULTIREGION_QUEUE_NAME}`)
  logger.info(`Monitor using: 'yarn cli bull monitor ${MULTIREGION_QUEUE_NAME}'`)
}

type MultiregionJob =
  | {
      type: 'move-project-region'
      payload: {
        projectId: string
        regionKey: string
      }
    }
  | {
      type: 'delete-project-region-data'
      payload: {
        projectId: string
        regionKey: string
      }
    }

let queue: Optional<Bull.Queue<MultiregionJob>>

export const buildMultiregionQueue = (queueName: string) =>
  new Bull(queueName, {
    ...buildBaseQueueOptions(),
    ...(!isTestEnv()
      ? {
          limiter: {
            max: 10,
            duration: 1000
          }
        }
      : {}),
    defaultJobOptions: {
      attempts: 5,
      timeout: 1000 * 60 * 15, // 15 minute timeout
      backoff: {
        type: 'fixed',
        delay: 1000 * 60 * 5
      },
      removeOnComplete: isProdEnv(),
      removeOnFail: false
    }
  })

export const getQueue = (): Bull.Queue => {
  if (!queue) {
    throw new UninitializedResourceAccessError(
      'Attempting to use uninitialized Bull queue'
    )
  }

  return queue
}

export const initializeQueue = () => {
  queue = buildMultiregionQueue(MULTIREGION_QUEUE_NAME)
}

/**
 * Add a job to the multiregion job queue.
 */
export const scheduleJob = async (jobData: MultiregionJob): Promise<string> => {
  const queue = getQueue()
  const job = await queue.add(jobData)
  return job.id.toString()
}

const isMultiregionJob = (job: Bull.Job): job is Bull.Job<MultiregionJob> => {
  const jobTypes: MultiregionJob['type'][] = [
    'move-project-region',
    'delete-project-region-data'
  ]
  return !!job.data.type && jobTypes.includes(job.data.type)
}

/**
 * Start processing jobs in queue in current process.
 */
export const startQueue = async () => {
  const queue = getQueue()
  queue.process(async (job) => {
    if (!isMultiregionJob(job)) {
      throw new MultiRegionInvalidJobError()
    }

    switch (job.data.type) {
      case 'move-project-region': {
        const { projectId, regionKey } = job.data.payload

        const sourceDb = await getProjectDbClient({ projectId })
        const sourceObjectStorage = await getProjectObjectStorage({ projectId })
        const targetDb = await (await getRegionDb({ regionKey })).transaction()
        const targetObjectStorage = await getRegionObjectStorage({ regionKey })

        const updateProjectRegion = updateProjectRegionFactory({
          getProject: getProjectFactory({ db: sourceDb }),
          getAvailableRegions: getAvailableRegionsFactory({
            getRegions: getRegionsFactory({ db }),
            canWorkspaceUseRegions: canWorkspaceUseRegionsFactory({
              getWorkspacePlan: getWorkspacePlanFactory({ db })
            })
          }),
          copyWorkspace: copyWorkspaceFactory({ sourceDb, targetDb }),
          copyProjects: copyProjectsFactory({ sourceDb, targetDb }),
          copyProjectModels: copyProjectModelsFactory({ sourceDb, targetDb }),
          copyProjectVersions: copyProjectVersionsFactory({ sourceDb, targetDb }),
          copyProjectObjects: copyProjectObjectsFactory({ sourceDb, targetDb }),
          copyProjectAutomations: copyProjectAutomationsFactory({ sourceDb, targetDb }),
          copyProjectComments: copyProjectCommentsFactory({ sourceDb, targetDb }),
          copyProjectWebhooks: copyProjectWebhooksFactory({ sourceDb, targetDb }),
          copyProjectBlobs: copyProjectBlobs({
            sourceDb,
            sourceObjectStorage,
            targetDb,
            targetObjectStorage
          }),
          validateProjectRegionCopy: validateProjectRegionCopyFactory({
            countProjectModels: getStreamBranchCountFactory({ db: sourceDb }),
            countProjectVersions: getStreamCommitCountFactory({ db: sourceDb }),
            countProjectObjects: getStreamObjectCountFactory({ db: sourceDb }),
            countProjectAutomations: getProjectAutomationsTotalCountFactory({
              db: sourceDb
            }),
            countProjectComments: getStreamCommentCountFactory({ db: sourceDb }),
            getProjectWebhooks: getStreamWebhooksFactory({ db: sourceDb })
          }),
          updateProjectRegionKey: updateProjectRegionKeyFactory({
            upsertProjectRegionKey: upsertProjectRegionKeyFactory({ db }),
            cacheDeleteRegionKey: deleteRegionKeyFromCacheFactory({
              redis: getGenericRedis()
            }),
            emitEvent: getEventBus().emit
          })
        })

        return await withTransaction(
          updateProjectRegion({ projectId, regionKey }),
          targetDb
        )
      }
      case 'delete-project-region-data':
      default:
        throw new MultiRegionNotYetImplementedError()
    }
  })
}

export const shutdownQueue = async () => {
  if (!queue) return
  await queue.close()
}
