import { scheduleExecutionFactory } from '@/modules/core/services/taskScheduler'
import {
  acquireTaskLockFactory,
  releaseTaskLockFactory
} from '@/modules/core/repositories/scheduledTasks'
import { db } from '@/db/knex'
import type { Logger } from '@/observability/logging'
import type { Knex } from 'knex'
import { getAllRegisteredDbClients } from '@/modules/multiregion/utils/dbSelector'
import { getStalePreparedTransactionsFactory } from '@/modules/multiregion/repositories/transactions'
import { rollbackPreparedTransaction } from '@/modules/shared/helpers/dbHelper'

const rollbackStalePreparedTransactions = async ({
  allRegions,
  logger
}: {
  allRegions: { client: Knex; regionKey: string }[]
  logger: Logger
}): Promise<void> => {
  for (const { regionKey, client } of allRegions) {
    const getStalePreparedTransactions = getStalePreparedTransactionsFactory({
      db: client
    })
    const pendingTransactions = await getStalePreparedTransactions({})
    if (!pendingTransactions.length) continue

    logger.error(
      { pendingTransactions, regionKey },
      'Found stale prepared transactions.'
    )

    await Promise.allSettled(
      pendingTransactions.map(({ gid }) => rollbackPreparedTransaction(client, gid))
    )
  }
}

export const scheduleStalePreparedTransactionCleanup = async () => {
  const allRegions = await getAllRegisteredDbClients()

  const scheduleExecution = scheduleExecutionFactory({
    acquireTaskLock: acquireTaskLockFactory({ db }),
    releaseTaskLock: releaseTaskLockFactory({ db })
  })

  const every5Mins = '*/5 * * * *'
  return scheduleExecution(
    every5Mins,
    'RollbackStalePreparedTransactions',
    async (_scheduledTime, { logger }) => {
      await rollbackStalePreparedTransactions({ logger, allRegions })
    }
  )
}
