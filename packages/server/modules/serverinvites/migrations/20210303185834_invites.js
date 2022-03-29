// /* istanbul ignore file */
exports.up = async (knex) => {
  await knex.schema.createTable('server_invites', (table) => {
    table.string('id').defaultTo(knex.raw('gen_random_uuid()')).primary()
    table.string('email', 256).unique().notNullable()
    table.string('inviterId', 256).notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.bool('used').defaultTo(false)
    table.string('message', 1024)
    table.string('resourceTarget', 256)
    table.string('resourceId', 256)
    table.string('role', 256)
  })
}

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('server_invites')
}
