const { ServerInvites } = require('@/modules/core/dbSchema')

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(ServerInvites.name, (table) => {
    // Add token field
    table.string('token', 256).defaultTo('').notNullable()
    table.index('token')
  })

  // Update all pre-existing rows and move inviteId to token
  await knex.raw(`
    UPDATE ${ServerInvites.name}
    SET token = COALESCE(id, '')
    WHERE coalesce(TRIM(token), '') = ''
  `)
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable(ServerInvites.name, (table) => {
    // Drop token field
    table.dropColumn('token')
  })
}
