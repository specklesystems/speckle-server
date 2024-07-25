import { Knex } from 'knex'

export const scanTableFactory = <TRecord extends object>({
  db
}: {
  db: Knex<TRecord>
}) =>
  async function* ({ tableName, batchSize }: { tableName: string; batchSize: number }) {
    const [rowsCount] = await db(tableName).count()
    const MAX_LIMIT = parseInt(rowsCount.count.toString())
    let offset = 0

    while (offset <= MAX_LIMIT) {
      yield db<TRecord>(tableName).limit(batchSize).offset(offset)
      offset += batchSize
    }
  }
