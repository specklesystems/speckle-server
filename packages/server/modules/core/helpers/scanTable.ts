import { Knex } from 'knex'

export const scanTableFactory = <TRecord extends object>({
  db
}: {
  db: Knex<TRecord>
}) =>
  async function* ({ tableName, batchSize }: { tableName: string; batchSize: number }) {
    let offset = 0

    let rows = []
    do {
      rows = await db<TRecord>(tableName).limit(batchSize).offset(offset)
      yield rows
      offset += batchSize
    } while (rows.length > 0 || offset > batchSize * 1000)
  }
