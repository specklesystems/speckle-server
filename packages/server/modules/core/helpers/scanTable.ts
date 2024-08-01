import { Knex } from 'knex'

export const scanTableFactory = <TRecord extends object>({
  db
}: {
  db: Knex<TRecord>
}) =>
  async function* (
    { tableName, batchSize }: { tableName: string; batchSize: number },
    options?: { failsafeLimitMultiplier?: number }
  ) {
    let offset = 0
    const failsafeLimit = batchSize * (options?.failsafeLimitMultiplier ?? 1000)

    let rows = []
    do {
      rows = await db<TRecord>(tableName).limit(batchSize).offset(offset)
      yield rows
      offset += batchSize

      if (offset > failsafeLimit) {
        throw new Error('Never ending loop')
      }
    } while (rows.length > 0)
  }
