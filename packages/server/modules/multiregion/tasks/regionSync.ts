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
  getAllUsersChecksumFactory,
  getAllUsersFactory,
  upsertUserFactory
} from '@/modules/core/repositories/users'
import { getAllProjectsChecksumFactory } from '@/modules/core/repositories/projects'
import {
  getAllWorkspaceChecksumFactory,
  getAllWorkspacesFactory,
  upsertWorkspaceFactory
} from '@/modules/workspaces/repositories/workspaces'
import type {
  GetAllWorkspaces,
  UpsertWorkspace
} from '@/modules/workspaces/domain/operations'
import type { GetAllUsers, UpsertUser } from '@/modules/core/domain/users/operations'

export const copyAllUsersAcrossRegionsFactory =
  (deps: {
    getAllUsers: GetAllUsers
    upsertUser: UpsertUser
  }): (({ logger }: { logger: Logger }) => Promise<void>) =>
  async ({ logger }) => {
    logger.info('Started user sync')

    const MAX_ITERATIONS = 10_000
    let cursor = null
    let items = []
    let iterationCount = 0
    do {
      if (iterationCount++ >= MAX_ITERATIONS) {
        logger.error(`Reached max iteration limit of ${MAX_ITERATIONS}.`)
        break
      }

      const batchedUsers = await deps.getAllUsers({ cursor, limit: 25 })
      cursor = batchedUsers.cursor
      items = batchedUsers.items

      await Promise.all(items.map((user) => deps.upsertUser({ user })))
    } while (cursor && items.length)

    logger.info('Finished user sync')
  }

export const copyAllWorkspacesAcrossRegionsFactory =
  (deps: {
    getAllWorkspaces: GetAllWorkspaces
    upsertWorkspace: UpsertWorkspace
  }): (({ logger }: { logger: Logger }) => Promise<void>) =>
  async ({ logger }) => {
    logger.info('Started workspace sync')

    const MAX_ITERATIONS = 10_000
    let cursor = null
    let items = []
    let iterationCount = 0
    do {
      if (iterationCount++ >= MAX_ITERATIONS) {
        logger.error(`Reached max iteration limit of ${MAX_ITERATIONS}.`)
        break
      }

      const batchedWorkspaces = await deps.getAllWorkspaces({ cursor, limit: 25 })
      cursor = batchedWorkspaces.cursor
      items = batchedWorkspaces.items

      await Promise.all(items.map((workspace) => deps.upsertWorkspace({ workspace })))
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

    const copyAllUsersAcressRegions = copyAllUsersAcrossRegionsFactory({
      getAllUsers: getAllUsersFactory({ db: mainDb }),
      upsertUser: upsertUserFactory({ db: regionDb })
    })

    await copyAllUsersAcressRegions({ logger })
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
      upsertWorkspace: upsertWorkspaceFactory({ db: regionDb })
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
