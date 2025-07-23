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
import {
  deleteProjectFactory,
  getProjectFactory,
  storeProjectFactory,
  storeProjectRolesFactory
} from '@/modules/core/repositories/projects'
import { getAvailableRegionsFactory } from '@/modules/workspaces/services/regions'
import { getRegionsFactory } from '@/modules/multiregion/repositories'
import { canWorkspaceUseRegionsFactory } from '@/modules/gatekeeper/services/featureAuthorization'
import { getWorkspacePlanFactory } from '@/modules/gatekeeper/repositories/billing'
import {
  upsertProjectRegionKeyFactory,
  deleteRegionKeyFromCacheFactory
} from '@/modules/multiregion/repositories/projectRegion'
import { updateProjectRegionKeyFactory } from '@/modules/multiregion/services/projectRegion'
import { getGenericRedis } from '@/modules/shared/redis/redis'
import { initializeQueue as setupQueue } from '@speckle/shared/queue'
import { getEventBus } from '@/modules/shared/services/eventBus'
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
import { waitForRegionProjectFactory } from '@/modules/core/services/projects'
import { chunk } from 'lodash-es'
import { getStreamCollaboratorsFactory } from '@/modules/core/repositories/streams'

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
        const { projectId, regionKey } = job.data.payload

        const sourceDb = await getProjectDbClient({ projectId })
        const sourceObjectStorage = (await getProjectObjectStorage({ projectId }))
          .private
        const targetDb = await getRegionDb({ regionKey })
        const targetObjectStorage = (await getRegionObjectStorage({ regionKey }))
          .private

        // Move project to target region
        const project = await withTransaction(
          async ({ db: targetDbTrx }) => {
            const updateProjectRegion = updateProjectRegionFactory({
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
              }),
              updateProjectRegionKey: updateProjectRegionKeyFactory({
                upsertProjectRegionKey: upsertProjectRegionKeyFactory({
                  db: targetDbTrx
                }),
                cacheDeleteRegionKey: deleteRegionKeyFromCacheFactory({
                  redis: getGenericRedis()
                }),
                emitEvent: getEventBus().emit
              })
            })

            return updateProjectRegion({ projectId, regionKey })
          },
          { db: targetDb }
        )

        // Grab project roles for later reinstating
        const projectRoles = await getStreamCollaboratorsFactory({ db })(project.id)

        // Delete project in main db to "unblock" replication
        await deleteProjectFactory({ db })({ projectId: project.id })

        try {
          // Wait for replication from regional db
          await waitForRegionProjectFactory({
            getProject: getProjectFactory({ db }),
            deleteProject: deleteProjectFactory({ db })
          })({
            projectId: project.id,
            regionKey,
            maxAttempts: 100
          })
        } catch (err) {
          // Failed to delete project or await replication, reset project state in main db
          await storeProjectFactory({ db })({ project })
          throw err
        }

        // Reinstate project acl records
        for (const roles of chunk(projectRoles, 10_000)) {
          await storeProjectRolesFactory({ db })({
            roles: roles.map((role) => ({
              projectId: project.id,
              userId: role.id,
              role: role.streamRole
            }))
          })
        }
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
