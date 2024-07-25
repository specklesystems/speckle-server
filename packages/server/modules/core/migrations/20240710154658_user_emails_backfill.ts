import { Knex } from 'knex'
import crs from 'crypto-random-string'
import { scanTableFactory } from '@/modules/core/helpers/scanTable'

export async function up(knex: Knex): Promise<void> {
  const batchSize = 1000

  for await (const rows of scanTableFactory({ db: knex })({
    tableName: 'users',
    batchSize
  })) {
    if (rows.length) {
      await knex('user_emails')
        .insert(
          rows.map((user) => ({
            id: crs({ length: 10 }),
            userId: user.id,
            email: user.email,
            verified: user.verified,
            primary: true
          }))
        )
        .onConflict(['userId', 'email'])
        .ignore()
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex('user_emails').delete()
}
