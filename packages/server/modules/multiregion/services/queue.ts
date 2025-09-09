import type Bull from 'bull'
import { logger } from '@/observability/logging'
import { isProdEnv, isTestEnv } from '@/modules/shared/helpers/envHelper'
import cryptoRandomString from 'crypto-random-string'
import type { Optional } from '@speckle/shared'
import { TIME_MS } from '@speckle/shared'
import { UninitializedResourceAccessError } from '@/modules/shared/errors'
import {
  MultiRegionInvalidJobError,
  MultiRegionNotYetImplementedError
} from '@/modules/multiregion/errors'
import {
  getProjectDbClient,
  getRegionDb,
  getReplicationDbs
} from '@/modules/multiregion/utils/dbSelector'
import {
  getProjectObjectStorage,
  getRegionObjectStorage
} from '@/modules/multiregion/utils/blobStorageSelector'
import {
  moveProjectToRegionFactory,
  validateProjectRegionCopyFactory
} from '@/modules/workspaces/services/projectRegions'
import { db } from '@/db/knex'
import {
  deleteProjectFactory,
  getProjectFactory
} from '@/modules/core/repositories/projects'
import { getAvailableRegionsFactory } from '@/modules/workspaces/services/regions'
import { getRegionsFactory } from '@/modules/multiregion/repositories'
import { canWorkspaceUseRegionsFactory } from '@/modules/gatekeeper/services/featureAuthorization'
import { getWorkspacePlanFactory } from '@/modules/gatekeeper/repositories/billing'
import {
  upsertProjectRegionKeyFactory,
  deleteRegionKeyFromCacheFactory,
  inMemoryRegionKeyStoreFactory
} from '@/modules/multiregion/repositories/projectRegion'
import { updateProjectRegionKeyFactory } from '@/modules/multiregion/services/projectRegion'
import { getGenericRedis } from '@/modules/shared/redis/redis'
import { initializeQueue as setupQueue } from '@speckle/shared/queue'
import {
  copyWorkspaceFactory,
  copyProjectsFactory,
  copyProjectModelsFactory,
  copyProjectVersionsFactory,
  copyProjectObjectsFactory,
  copyProjectAutomationsFactory,
  copyProjectCommentsFactory,
  copyProjectWebhooksFactory,
  copyProjectBlobs,
  countProjectModelsFactory,
  countProjectVersionsFactory,
  countProjectObjectsFactory,
  countProjectAutomationsFactory,
  countProjectCommentsFactory,
  countProjectWebhooksFactory
} from '@/modules/workspaces/repositories/projectRegions'
import { withTransaction } from '@/modules/shared/helpers/dbHelper'
import { getRedisUrl } from '@/modules/shared/helpers/envHelper'
import { asMultiregionalOperation, replicateFactory } from '@/modules/shared/command'
import { deleteProjectAndCommitsFactory } from '@/modules/core/services/projects'
import { deleteProjectCommitsFactory } from '@/modules/core/repositories/commits'
import { getProjectRegionKey } from '@/modules/multiregion/utils/regionSelector'

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

export const getQueue = (): Bull.Queue<MultiregionJob> => {
  if (!queue) {
    throw new UninitializedResourceAccessError(
      'Attempting to use uninitialized Bull queue'
    )
  }

  return queue
}

export const initializeQueue = async () => {
  queue = await setupQueue({
    queueName: MULTIREGION_QUEUE_NAME,
    redisUrl: getRedisUrl(),
    options: {
      ...(!isTestEnv()
        ? {
            limiter: {
              max: 10,
              duration: TIME_MS.second
            }
          }
        : {}),
      defaultJobOptions: {
        attempts: 5,
        timeout: 15 * TIME_MS.minute,
        backoff: {
          type: 'fixed',
          delay: 5 * TIME_MS.minute
        },
        removeOnComplete: isProdEnv(),
        removeOnFail: false
      }
    }
  })
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
  void queue.process(async (job) => {
    if (!isMultiregionJob(job)) {
      throw new MultiRegionInvalidJobError()
    }

    logger.info(
      {
        jobId: job.id,
        jobQueue: MULTIREGION_QUEUE_NAME,
        payload: job.data.payload,
        type: job.data.type
      },
      'Processing multiregion job {jobId}'
    )

    switch (job.data.type) {
      case 'move-project-region': {
        const { projectId, regionKey: targetRegionKey } = job.data.payload

        if (targetRegionKey === null)
          throw new MultiRegionInvalidJobError('Target region cannot be main')

        const sourceDb = await getProjectDbClient({ projectId })
        const sourceRegionKey = await getProjectRegionKey({ projectId })
        const sourceObjectStorage = (await getProjectObjectStorage({ projectId }))
          .private
        const targetDb = await getRegionDb({ regionKey: targetRegionKey })
        const targetObjectStorage = (
          await getRegionObjectStorage({ regionKey: targetRegionKey })
        ).private

        // Move project to target region
        await withTransaction(
          async ({ db: targetDbTrx }) => {
            const moveProjectToRegion = moveProjectToRegionFactory({
              getProject: getProjectFactory({ db: sourceDb }),
              getAvailableRegions: getAvailableRegionsFactory({
                getRegions: getRegionsFactory({ db }),
                canWorkspaceUseRegions: canWorkspaceUseRegionsFactory({
                  getWorkspacePlan: getWorkspacePlanFactory({ db })
                })
              }),
              copyWorkspace: copyWorkspaceFactory({
                sourceDb,
                targetDb: targetDbTrx
              }),
              copyProjects: copyProjectsFactory({
                sourceDb,
                targetDb: targetDbTrx
              }),
              copyProjectModels: copyProjectModelsFactory({
                sourceDb,
                targetDb: targetDbTrx
              }),
              copyProjectVersions: copyProjectVersionsFactory({
                sourceDb,
                targetDb: targetDbTrx
              }),
              copyProjectObjects: copyProjectObjectsFactory({
                sourceDb,
                targetDb: targetDbTrx
              }),
              copyProjectAutomations: copyProjectAutomationsFactory({
                sourceDb,
                targetDb: targetDbTrx
              }),
              copyProjectComments: copyProjectCommentsFactory({
                sourceDb,
                targetDb: targetDbTrx
              }),
              copyProjectWebhooks: copyProjectWebhooksFactory({
                sourceDb,
                targetDb: targetDbTrx
              }),
              copyProjectBlobs: copyProjectBlobs({
                sourceDb,
                sourceObjectStorage,
                targetDb: targetDbTrx,
                targetObjectStorage
              }),
              validateProjectRegionCopy: validateProjectRegionCopyFactory({
                countProjectModels: countProjectModelsFactory({ db: sourceDb }),
                countProjectVersions: countProjectVersionsFactory({ db: sourceDb }),
                countProjectObjects: countProjectObjectsFactory({ db: sourceDb }),
                countProjectAutomations: countProjectAutomationsFactory({
                  db: sourceDb
                }),
                countProjectComments: countProjectCommentsFactory({ db: sourceDb }),
                countProjectWebhooks: countProjectWebhooksFactory({ db: sourceDb })
              })
            })

            await moveProjectToRegion({ projectId, regionKey: targetRegionKey })
          },
          {
            db: targetDb
          }
        )

        const { writeRegion } = inMemoryRegionKeyStoreFactory()

        // Update project region in dbs and update relevant caches
        await asMultiregionalOperation(
          async ({ allDbs, emit }) =>
            updateProjectRegionKeyFactory({
              upsertProjectRegionKey: replicateFactory(
                allDbs,
                upsertProjectRegionKeyFactory
              ),
              cacheDeleteRegionKey: deleteRegionKeyFromCacheFactory({
                redis: getGenericRedis()
              }),
              writeRegionToMemory: writeRegion,
              emitEvent: emit
            })({ projectId, regionKey: targetRegionKey }),
          {
            name: 'updateProjectRegion',
            description: 'Update project region in db and update relevant caches',
            logger,
            dbs: await getReplicationDbs({ regionKey: targetRegionKey })
          }
        )

        // if we got to here, we must delete the project from the region so its not replicated back with the old regionKey
        // and we only do it if the source region is not main, because:
        // - we expect the project to exist only in main and in the target region
        // - as we delete the project, everything cascades down (webhooks, automations ....) and this is okay for sub region
        // BUT, we can't delete from main because it will cascade down also acls and other entities that must be kept in main.
        //
        // if at some point we allow the feature to move back to main region, we will need to tackle this.
        // As for now, projects can only move between regions this if avoids complexity

        if (sourceRegionKey !== null) {
          logger.info(
            {
              jobId: job.id,
              jobQueue: MULTIREGION_QUEUE_NAME,
              payload: job.data.payload,
              type: job.data.type,
              projectId,
              sourceRegionKey
            },
            'Dropping project from source region {jobId}'
          )
          await deleteProjectAndCommitsFactory({
            deleteProject: deleteProjectFactory({
              db: sourceDb
            }),
            deleteProjectCommits: deleteProjectCommitsFactory({
              db: sourceDb
            })
          })({ projectId })
        }

        return
      }
      case 'delete-project-region-data':
      default:
        throw new MultiRegionNotYetImplementedError()
    }
  })
  void queue.on('completed', (job) => {
    const { projectId, regionKey } = job.data.payload
    logger.info(
      {
        jobId: job.id,
        jobQueue: MULTIREGION_QUEUE_NAME,
        projectId,
        regionKey
      },
      'Completed multiregion job {jobId}'
    )
  })
  void queue.on('failed', (job, err) => {
    logger.error(
      {
        jobId: job.id,
        jobQueue: MULTIREGION_QUEUE_NAME,
        error: err,
        errorMessage: err.message
      },
      'Failed to process multiregion job {jobId}'
    )
  })
  void queue.on('error', (err) => {
    logger.error(
      {
        jobQueue: MULTIREGION_QUEUE_NAME,
        error: err,
        errorMessage: err.message
      },
      'Failed to process multiregion job'
    )
  })
}

export const shutdownQueue = async () => {
  if (!queue) return
  await queue.close()
}
