import type { StalePendingTransaction } from '@/modules/multiregion/domain/types'
import type { Knex } from 'knex'

export const getStalePreparedTransactionsFactory =
  ({ db }: { db: Knex }) =>
  async (args: { interval?: string }): Promise<StalePendingTransaction[]> => {
    const { interval = '2 minutes' } = args
    return (
      await db.raw<{ rows: StalePendingTransaction[] }>(
        `SELECT * FROM pg_prepared_xacts WHERE prepared < NOW() - INTERVAL '${interval}';`
      )
    ).rows
  }
