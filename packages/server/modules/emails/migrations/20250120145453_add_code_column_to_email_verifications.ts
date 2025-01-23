import { coreLogger } from '@/modules/core/logger'
import { Knex } from 'knex'

const TABLE_NAME = 'email_verifications'

export async function up(knex: Knex): Promise<void> {
  const trx = await knex.transaction()
  try {
    await trx.schema.alterTable(TABLE_NAME, (table) => {
      table.string('code')
      table.unique('email')
    })
  } catch (error) {
    coreLogger.debug('Failed to apply unique constraint to email_verifications table')
  } finally {
    await trx.commit()
  }
}

export async function down(knex: Knex): Promise<void> {
  const trx = await knex.transaction()
  try {
    await trx.schema.alterTable(TABLE_NAME, (table) => {
      table.dropColumn('code')
      table.dropUnique(['email'])
    })
  } catch (error) {
    coreLogger.debug('Failed to drop unique constraint to email_verifications table')
  } finally {
    await trx.commit()
  }
}

export const config = { transaction: false }
