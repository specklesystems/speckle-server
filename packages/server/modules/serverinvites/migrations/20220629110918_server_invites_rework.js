const TABLE_NAME = 'server_invites'

const NEW_UNIQUE_IDX_COLS = ['target', 'resourceTarget', 'resourceId']
const NEW_IDX_2 = ['resourceTarget', 'resourceId']

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // First lets delete all invites with an invalid user ID, otherwise
  // the new foreign key will fail
  await knex(TABLE_NAME)
    .whereNotIn('inviterId', knex().from('users').select('id'))
    .delete()

  // Also lets delete used up invites, we're going to be dropping the column at some point
  await knex(TABLE_NAME).where('used', true).delete()

  await knex.schema.alterTable(TABLE_NAME, (table) => {
    // Drop unique index
    table.dropUnique('email')

    // Rename email -> target
    table.renameColumn('email', 'target')

    // Create new unique index
    table.unique(NEW_UNIQUE_IDX_COLS)

    // Add a FK to the users table for inviterId
    table.foreign('inviterId').references('id').inTable('users').onDelete('cascade')

    // Add idx to resourceTarget & resourceId for fast access
    table.index(NEW_IDX_2)
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Since we want to add back the unique idx on email, we need to delete rows that have duplicate emails
  await knex(TABLE_NAME)
    .whereIn(
      'target',
      knex(TABLE_NAME).select('target').groupBy('target').havingRaw('COUNT(id) > 1')
    )
    .delete()

  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropIndex(NEW_IDX_2)
    table.dropForeign('inviterId')
    table.dropUnique(NEW_UNIQUE_IDX_COLS)
    table.renameColumn('target', 'email')
    table.unique('email')
  })
}
