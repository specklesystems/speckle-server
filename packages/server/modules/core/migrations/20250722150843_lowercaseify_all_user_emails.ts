import { Knex } from 'knex'

const usersTable = 'users'
const userEmailsTable = 'user_emails'

export async function up(knex: Knex): Promise<void> {
  // In both tables, update all row "email" columns to be fully lowercase
  await knex.transaction(async (trx) => {
    // Update users table
    await trx(usersTable)
      .update({
        email: trx.raw('LOWER(email)')
      })
      .whereNotNull('email')

    // Update user_emails table
    await trx(userEmailsTable)
      .update({
        email: trx.raw('LOWER(email)')
      })
      .whereNotNull('email')
  })
}

export async function down(): Promise<void> {
  // do nothing
}
