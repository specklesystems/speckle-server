const { ServerInvites, Users } = require('@/modules/core/dbSchema')

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // First lets delete all invites with an invalid user ID, otherwise
  // the new foreign key will fail
  await knex(ServerInvites.name)
    .whereNotIn(ServerInvites.col.inviterId, Users.knex().select(Users.col.id))
    .delete()

  // Also lets delete used up invites, we're going to be dropping the column at some point
  await knex(ServerInvites.name).where(ServerInvites.col.used, true).delete()

  await knex.schema.alterTable(ServerInvites.name, (table) => {
    // Drop unique index
    table.dropUnique('email')

    // Rename email -> target
    table.renameColumn('email', 'target')

    // Create new index
    table.unique(['target', 'resourceTarget', 'resourceId'])

    // Add a FK to the users table for inviterId
    table.foreign('inviterId').references(Users.col.id).onDelete('cascade')

    // Add idx to resourceTarget & resourceId for fast access
    table.index(['resourceTarget', 'resourceId'])
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable(ServerInvites.name, (table) => {
    table.dropIndex(['resourceTarget', 'resourceId'])
    table.dropForeign('inviterId')
    table.dropUnique(['target', 'resourceTarget', 'resourceId'])
    table.renameColumn('target', 'email')
    table.unique('email')
  })
}
