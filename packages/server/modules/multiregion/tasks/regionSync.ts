import { scheduleExecutionFactory } from '@/modules/core/services/taskScheduler'
import {
  acquireTaskLockFactory,
  releaseTaskLockFactory
} from '@/modules/core/repositories/scheduledTasks'
import { db } from '@/db/knex'
import type { Logger } from '@/observability/logging'
import type { Knex } from 'knex'
import { getAllRegisteredDbClients } from '@/modules/multiregion/utils/dbSelector'

const autoSyncRegions = async ({
  allRegions,
  logger
}: {
  mainDb: { client: Knex }
  allRegions: { client: Knex; regionKey: string }[]
  logger: Logger
}): Promise<void> => {
  if (!allRegions.length) return

  for (const { regionKey } of allRegions) {
    const regionContainsAllMainUsers = ''
    if (regionContainsAllMainUsers) continue

    logger.error({ regionKey, entity: 'users' }, `Cross-region mismatch`)

    // TODO: solve user state
  }

  for (const { regionKey } of allRegions) {
    const regionContainsAllMainWorkspaces = ''
    if (regionContainsAllMainWorkspaces) continue

    logger.error({ regionKey, entity: 'workspaces' }, `Cross-region mismatch`)

    // TODO: solve workspace state
  }

  for (const { regionKey } of allRegions) {
    const mainContainsAllRegionProjects = ''
    if (mainContainsAllRegionProjects) continue

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
