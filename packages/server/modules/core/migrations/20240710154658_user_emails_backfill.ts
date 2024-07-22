import { UserRecord } from '@/modules/core/helpers/types'
import { Knex } from 'knex'
import crs from 'crypto-random-string'

export async function up(knex: Knex): Promise<void> {
  const batchSize = 1000
  const offset = 0
  let users = []

  do {
    users = await knex<UserRecord>('users')
      .select(['id', 'email', 'verified'])
      .limit(batchSize)
      .offset(offset)

    if (users.length === 0) return

    await knex('user_emails')
      .insert(
        users.map((user) => ({
          id: crs({ length: 10 }),
          userId: user.id,
          email: user.email,
          verified: user.verified,
          primary: true
        }))
      )
      .onConflict(['userId', 'email'])
      .ignore()
  } while (users.length > 0)
}

export async function down(knex: Knex): Promise<void> {
  await knex('user_emails').delete()
}
