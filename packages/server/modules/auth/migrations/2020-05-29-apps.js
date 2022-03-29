/* istanbul ignore file */
'use strict'

// Knex table migrations
exports.up = async (knex) => {
  // Applications that integrate with this server.
  await knex.schema.createTable('server_apps', (table) => {
    table.string('id', 10).primary()
    table.string('secret', 10)

    table.string('name', 256).notNullable()
    table.string('description', 512)
    table.string('termsAndConditionsLink', 256)
    table.string('logo', 524288)

    table.boolean('public').defaultTo(false)
    table.boolean('trustByDefault').defaultTo(false)

    table.string('authorId').references('id').inTable('users').onDelete('cascade')
    table.timestamp('createdAt').defaultTo(knex.fn.now())

    table.string('redirectUrl', 100).notNullable()
  })

  // Tracks which scopes are available to each individual app.
  await knex.schema.createTable('server_apps_scopes', (table) => {
    table
      .string('appId')
      .references('id')
      .inTable('server_apps')
      .notNullable()
      .onDelete('cascade')
      .index()
    table
      .string('scopeName')
      .references('name')
      .inTable('scopes')
      .notNullable()
      .onDelete('cascade')
      .index()
  })

  await knex.schema.createTable('authorization_codes', (table) => {
    table.string('id').primary()
    table.string('appId').references('id').inTable('server_apps').onDelete('cascade')
    table.string('userId').references('id').inTable('users').onDelete('cascade')
    table.string('challenge').notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.bigint('lifespan').defaultTo(6e5) // 10 minutes
  })

  await knex.schema.createTable('refresh_tokens', (table) => {
    table.string('id').primary()
    table.string('tokenDigest').notNullable()
    table.string('appId').references('id').inTable('server_apps').onDelete('cascade')
    table.string('userId').references('id').inTable('users').onDelete('cascade')
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.bigint('lifespan').defaultTo(1.577e10) // 6 months
  })

  await knex.schema.createTable('user_server_app_tokens', (table) => {
    table
      .string('appId')
      .references('id')
      .inTable('server_apps')
      .notNullable()
      .onDelete('cascade')
      .index()
    table
      .string('userId')
      .references('id')
      .inTable('users')
      .notNullable()
      .onDelete('cascade')
      .index()
    table
      .string('tokenId')
      .references('id')
      .inTable('api_tokens')
      .notNullable()
      .onDelete('cascade')
      .index()
  })

  // let appTokenScopes = [ {
  //   name: 'apps:read',
  //   description: 'See what applications you have created or have authorized.'
  // }, {
  //   name: 'apps:write',
  //   description: 'Register applications on your behalf.'
  // } ]

  // await knex( 'scopes' ).insert( appTokenScopes )
}

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('server_apps_scopes')
  await knex.schema.dropTableIfExists('authorization_codes')
  await knex.schema.dropTableIfExists('refresh_tokens')
  await knex.schema.dropTableIfExists('user_server_app_tokens')

  await knex.schema.dropTableIfExists('server_apps')
}
