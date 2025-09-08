import { scheduleExecutionFactory } from '@/modules/core/services/taskScheduler'
import {
  acquireTaskLockFactory,
  releaseTaskLockFactory
} from '@/modules/core/repositories/scheduledTasks'
import { db, mainDb } from '@/db/knex'
import type { Logger } from '@/observability/logging'
import type { Knex } from 'knex'
import { getAllRegisteredDbClients } from '@/modules/multiregion/utils/dbSelector'
import {
  bulkUpsertUsersFactory,
  getAllUsersChecksumFactory,
  getAllUsersFactory
} from '@/modules/core/repositories/users'
import { getAllProjectsChecksumFactory } from '@/modules/core/repositories/projects'
import {
  bulkUpsertWorkspacesFactory,
  getAllWorkspaceChecksumFactory,
  getAllWorkspacesFactory
} from '@/modules/workspaces/repositories/workspaces'
import type {
  BulkUpsertWorkspaces,
  GetAllWorkspaces
} from '@/modules/workspaces/domain/operations'
import type {
  BulkUpsertUsers,
  GetAllUsers
} from '@/modules/core/domain/users/operations'

const MAX_ITERATIONS = 10_000
const BATCH_SIZE = 500

export const copyAllUsersAcrossRegionsFactory =
  (deps: {
    getAllUsers: GetAllUsers
    bulkUpsertUsers: BulkUpsertUsers
  }): (({ logger }: { logger: Logger }) => Promise<void>) =>
  async ({ logger }) => {
    logger.info('Started user sync')

    let cursor = null
    let items = []
    let iterationCount = 0
    do {
      if (iterationCount++ >= MAX_ITERATIONS) {
        logger.error(`Reached max iteration limit of ${MAX_ITERATIONS}.`)
        break
      }

      const batchedUsers = await deps.getAllUsers({ cursor, limit: BATCH_SIZE })
      cursor = batchedUsers.cursor
      items = batchedUsers.items

      await deps.bulkUpsertUsers({ users: items })
    } while (cursor && items.length)

    logger.info('Finished user sync')
  }

export const copyAllWorkspacesAcrossRegionsFactory =
  (deps: {
    getAllWorkspaces: GetAllWorkspaces
    bulkUpsertWorkspaces: BulkUpsertWorkspaces
  }): (({ logger }: { logger: Logger }) => Promise<void>) =>
  async ({ logger }) => {
    logger.info('Started workspace sync')

    let cursor = null
    let items = []
    let iterationCount = 0
    do {
      if (iterationCount++ >= MAX_ITERATIONS) {
        logger.error(`Reached max iteration limit of ${MAX_ITERATIONS}.`)
        break
      }

      const batchedWorkspaces = await deps.getAllWorkspaces({
        cursor,
        limit: BATCH_SIZE
      })
      cursor = batchedWorkspaces.cursor
      items = batchedWorkspaces.items

      await deps.bulkUpsertWorkspaces({ workspaces: items })
    } while (cursor && items.length)

    logger.info('Finished workspace sync')
  }

const autoSyncRegions = async ({
  allRegions,
  logger
}: {
  mainDb: { client: Knex }
  allRegions: { client: Knex; regionKey: string }[]
  logger: Logger
}): Promise<void> => {
  if (!allRegions.length) return

  for (const { regionKey, client: regionDb } of allRegions) {
    const [mainDbChecksum, regionDbChecksum] = await Promise.all([
      getAllUsersChecksumFactory({ db: mainDb })(),
      getAllUsersChecksumFactory({ db: regionDb })()
    ])

    if (mainDbChecksum === regionDbChecksum) continue

    logger.error({ regionKey, entity: 'users' }, `Cross-region mismatch`)

    const copyAllUsersAcrossRegions = copyAllUsersAcrossRegionsFactory({
      getAllUsers: getAllUsersFactory({ db: mainDb }),
      bulkUpsertUsers: bulkUpsertUsersFactory({ db: regionDb })
    })

    await copyAllUsersAcrossRegions({ logger })
  }

  for (const { regionKey, client: regionDb } of allRegions) {
    const [mainDbChecksum, regionDbChecksum] = await Promise.all([
      getAllWorkspaceChecksumFactory({ db: mainDb })(),
      getAllWorkspaceChecksumFactory({ db: regionDb })()
    ])
    if (mainDbChecksum === regionDbChecksum) continue

    logger.error({ regionKey, entity: 'workspaces' }, `Cross-region mismatch`)

    const copyAllWorkspacesAcrossRegions = copyAllWorkspacesAcrossRegionsFactory({
      getAllWorkspaces: getAllWorkspacesFactory({ db: mainDb }),
      bulkUpsertWorkspaces: bulkUpsertWorkspacesFactory({ db: regionDb })
    })

    await copyAllWorkspacesAcrossRegions({ logger })
  }

  for (const { regionKey, client: regionDb } of allRegions) {
    const [mainDbChecksum, regionDbChecksum] = await Promise.all([
      getAllProjectsChecksumFactory({ db: mainDb })({ regionKey }),
      getAllProjectsChecksumFactory({ db: regionDb })({ regionKey })
    ])

    if (mainDbChecksum === regionDbChecksum) continue

    logger.error({ regionKey, entity: 'projects' }, `Cross-region mismatch`)
  }
}

export const scheduleAutoSyncRegions = async () => {
  const [mainDb, ...allRegions] = await getAllRegisteredDbClients()

  const scheduleExecution = scheduleExecutionFactory({
    acquireTaskLock: acquireTaskLockFactory({ db }),
    releaseTaskLock: releaseTaskLockFactory({ db })
  })

  const everyHour = '0 * * * *'
  return scheduleExecution(
    everyHour,
    'AutoSyncRegions',
    async (_scheduledTime, { logger }) => {
      await autoSyncRegions({ logger, mainDb, allRegions })
    }
  )
}
