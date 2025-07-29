import cryptoRandomString from 'crypto-random-string'
import type { Knex } from 'knex'

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
  const preparedTrxs: {
    knex: Knex
    preparedId: string
  }[] = []

  try {
    for (const db of dbs) {
      const trx = await db.transaction()
      const preparedId = cryptoRandomString({ length: 10 })

      await query({ db: trx })(params)
      await trx.raw(`PREPARE TRANSACTION '${preparedId}' ;`)

      preparedTrxs.push({ knex: db, preparedId })
    }

    await Promise.all(
      preparedTrxs.map(({ knex, preparedId }) =>
        knex.raw(`COMMIT PREPARED '${preparedId}' ;`)
      )
    )
  } catch (err) {
    const rollbacks = preparedTrxs.map(({ knex, preparedId }) =>
      knex.raw(`ROLLBACK PREPARED '${preparedId}' ;`).catch(() => {
        console.error({ preparedId }, `Fatal: 2PC rollback failed`)
      })
    )

    console.warn(err, '2PC error. Rolling back')
    await Promise.all(rollbacks)
    throw new Error('2PC failed: All transactions rolled back')
  }
}
