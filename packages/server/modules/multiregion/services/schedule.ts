import type cron from 'node-cron'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { scheduleExecutionFactory } from '@/modules/core/services/taskScheduler'
import {
  acquireTaskLockFactory,
  releaseTaskLockFactory
} from '@/modules/core/repositories/scheduledTasks'
import { db } from '@/db/knex'
import type { Logger } from '@/observability/logging'
import type { Knex } from 'knex'
import { getAllRegisteredDbClients } from '@/modules/multiregion/utils/dbSelector'

const { FF_WORKSPACES_MULTI_REGION_ENABLED } = getFeatureFlags()

let allRegions: { client: Knex; regionKey: string }[] = []
const scheduledTasks: cron.ScheduledTask[] = []

type StalePendingTransaction = {
  transaction: string
  gid: string
  prepared: Date
}

const getStalePreparedTransactionsFactory =
  ({ db }: { db: Knex }) =>
  async (): Promise<StalePendingTransaction[]> => {
    return await db.raw(
      `SELECT * FROM pg_prepared_xacts WHERE prepared < NOW() - INTERVAL '10 minutes';`
    )
  }

const rollbackPreparedTransactionFactory =
  ({ db }: { db: Knex }) =>
  async ({ transaction }: StalePendingTransaction): Promise<void> => {
    await db.raw(`ROLLBACK PREPARED '${transaction}';`)
  }

const rollbackStalePreparedTransactions = async ({
  logger
}: {
  logger: Logger
}): Promise<void> => {
  for (const { regionKey, client } of allRegions) {
    const getStalePreparedTransactions = getStalePreparedTransactionsFactory({
      db: client
    })
    const pendingTransactions = await getStalePreparedTransactions()
    if (!pendingTransactions.length) continue

    logger.error(
      { pendingTransactions, regionKey },
      'Found stale prepared transactions.'
    )
    const rollbackPreparedTransaction = rollbackPreparedTransactionFactory({
      db: client
    })
    await Promise.all(pendingTransactions.map(rollbackPreparedTransaction))
  }
}

export const startSchedule = async () => {
  if (!FF_WORKSPACES_MULTI_REGION_ENABLED) return

  allRegions = await getAllRegisteredDbClients()

  const scheduleExecution = scheduleExecutionFactory({
    acquireTaskLock: acquireTaskLockFactory({ db }),
    releaseTaskLock: releaseTaskLockFactory({ db })
  })

  const every5Mins = '*/5 * * * *'
  scheduledTasks.push(
    scheduleExecution(
      every5Mins,
      'RollbackStalePreparedTransactions',
      async (_scheduledTime, { logger }) => {
        await rollbackStalePreparedTransactions({ logger })
      }
    )
  )
}

export const shutdownSchedule = () => {
  scheduledTasks?.forEach((task) => task.stop())
}
