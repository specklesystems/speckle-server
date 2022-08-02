const { Users } = require('@/modules/core/dbSchema')

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(Users.name, (table) => {
    table.string('email').notNullable().alter()
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable(Users.name, (table) => {
    table.string('email').nullable().alter()
  })
}
