import { scheduleExecutionFactory } from '@/modules/core/services/taskScheduler'
import {
  acquireTaskLockFactory,
  releaseTaskLockFactory
} from '@/modules/core/repositories/scheduledTasks'
import { db, mainDb } from '@/db/knex'
import type { Logger } from '@/observability/logging'
import type { Knex } from 'knex'
import { getAllRegisteredDbClients } from '@/modules/multiregion/utils/dbSelector'
import { getAllUsersChecksumFactory } from '@/modules/core/repositories/users'
import { getAllProjectsChecksumFactory } from '@/modules/core/repositories/projects'
import { getAllWorkspaceChecksumFactory } from '@/modules/workspaces/repositories/workspaces'

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

    // TODO: auto-sync
  }

  for (const { regionKey, client: regionDb } of allRegions) {
    const [mainDbChecksum, regionDbChecksum] = await Promise.all([
      getAllWorkspaceChecksumFactory({ db: mainDb })(),
      getAllWorkspaceChecksumFactory({ db: regionDb })()
    ])
    if (mainDbChecksum === regionDbChecksum) continue

    logger.error({ regionKey, entity: 'workspaces' }, `Cross-region mismatch`)

    // TODO: auto-sync
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

  const everyHour = '*/1 * * * *'
  return scheduleExecution(
    everyHour,
    'AutoSyncRegions',
    async (_scheduledTime, { logger }) => {
      await autoSyncRegions({ logger, mainDb, allRegions })
    }
  )
}
