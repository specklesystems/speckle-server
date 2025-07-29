import cryptoRandomString from 'crypto-random-string'
import type { Knex } from 'knex'

interface DatabaseWithPreparedId {
  knex: Knex
  preparedId: string
}

/**
 * 2PC transaction
 * https://en.wikipedia.org/wiki/Two-phase_commit_protocol
 * https://www.postgresql.org/docs/current/two-phase.html
 */
export async function replicateQuery<T, R>({
  dbs,
  query,
  params
}: {
  dbs: Knex[]
  query: ({ db }: { db: Knex }) => (params: T) => Promise<R>
  params: T
}): Promise<void> {
  // TODO: restructure
  const preparedTransactions: DatabaseWithPreparedId[] = []

  try {
    for (const db of dbs) {
      const trx = await db.transaction()
      const preparedId = cryptoRandomString({ length: 10 })

      await query({ db: trx })(params)
      await trx.raw(`PREPARE TRANSACTION '${preparedId}' ;`)

      preparedTransactions.push({ knex: db, preparedId })
    }

    // If all PREPAREs succeeded, COMMIT
    await Promise.all(
      preparedTransactions.map(({ knex, preparedId }) =>
        knex.raw(`COMMIT PREPARED '${preparedId}' ;`)
      )
    )
  } catch (err) {
    console.warn(err, '2PC error. Rolling back')
    await Promise.all(
      preparedTransactions.map(({ knex, preparedId }) =>
        knex.raw(`ROLLBACK PREPARED '${preparedId}' ;`).catch(() => {
          console.error({ preparedId }, `Fatal: 2PC rollback failed`)
        })
      )
    )

    throw new Error('2PC failed: All transactions rolled back')
  }
}
