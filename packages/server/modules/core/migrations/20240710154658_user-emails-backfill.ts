import { UserRecord } from '@/modules/core/helpers/types'
import { Knex } from 'knex'
import crs from 'crypto-random-string'

export async function up(knex: Knex): Promise<void> {
  const users = await knex<UserRecord>('users').select(['id', 'email', 'verified'])

  if (users.length > 0) {
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
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex('user_emails').delete()
}
