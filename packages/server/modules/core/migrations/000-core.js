/* istanbul ignore file */
'use strict'

// Knex table migrations
exports.up = async (knex) => {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

  // Base table holding up some configuration variables for the server. Not really used much.
  await knex.schema.createTable('server_config', (table) => {
    table.integer('id').notNullable().defaultTo(0).index()
    table.string('name').defaultTo('My new Speckle Server')
    table.string('company').defaultTo('Unknown Company')
    table
      .string('description')
      .defaultTo('This a community deployment of a Speckle Server.')
    table.string('adminContact').defaultTo('n/a')
    table.string('termsOfService').defaultTo('n/a')
    table.string('canonicalUrl') // TODO: to be removed, it's not used anymore
    table.boolean('completed').defaultTo(false)
  })

  await knex('server_config').insert({ id: 0 })

  // Users.
  await knex.schema.createTable('users', (table) => {
    table.string('id', 10).primary()
    table.string('suuid').defaultTo(knex.raw('gen_random_uuid()')).index()
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.string('name', 512).notNullable()
    table.string('bio', 2048)
    table.string('company', 512)
    table.string('email').unique()
    table.bool('verified').defaultTo(false)
    table.string('avatar', 524288)
    table.jsonb('profiles')
    table.string('passwordDigest') // bcrypted pwd
  })

  // Roles.
  // Roles keep track of their name and the target resource they are applied to.
  // The target resource must be a table name.
  // The higher the weight, the bigger the permissions.
  await knex.schema.createTable('user_roles', (table) => {
    table.string('name', 256).primary()
    table.string('description', 256).notNullable()
    table.string('resourceTarget', 256).notNullable()
    table.string('aclTableName', 256).notNullable()
    table.integer('weight').defaultTo(100).notNullable()
  })

  // Server-wide access control list.
  await knex.schema.createTable('server_acl', (table) => {
    table
      .string('userId', 10)
      .references('id')
      .inTable('users')
      .primary()
      .onDelete('cascade')
    table
      .string('role')
      .references('name')
      .inTable('user_roles')
      .notNullable()
      .onDelete('cascade')
  })

  // Tokens.
  await knex.schema.createTable('api_tokens', (table) => {
    table.string('id', 10).primary()
    table.string('tokenDigest').unique()
    table
      .string('owner', 10)
      .references('id')
      .inTable('users')
      .notNullable()
      .onDelete('cascade')
    table.string('name', 512)
    table.string('lastChars', 6)
    table.boolean('revoked').defaultTo(false)
    table.bigint('lifespan').defaultTo(3.154e12) // defaults to a lifespan of 100 years
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.timestamp('lastUsed').defaultTo(knex.fn.now())
  })

  // Tokens generated directly by a user from an application.
  await knex.schema.createTable('personal_api_tokens', (table) => {
    table.string('tokenId').references('id').inTable('api_tokens').onDelete('cascade')
    table.string('userId').references('id').inTable('users').onDelete('cascade')
  })

  // Registered application scopes table.
  // Scopes limit what a token can actually do.
  await knex.schema.createTable('scopes', (table) => {
    table.string('name', 512).primary()
    table.string('description', 512).notNullable()
  })

  // Token >- -< Scopes junction table.
  await knex.schema.createTable('token_scopes', (table) => {
    table
      .string('tokenId')
      .references('id')
      .inTable('api_tokens')
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
    table.index(['tokenId', 'scopeName'], 'token_scope_combined_idx')
  })

  // Streams table.
  await knex.schema.createTable('streams', (table) => {
    table.string('id', 10).primary()
    table.string('name', 512).notNullable().defaultTo('Unnamed Stream')
    table.string('description', 65536)
    table.boolean('isPublic').defaultTo(true)
    table.string('clonedFrom', 10).references('id').inTable('streams')
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.timestamp('updatedAt').defaultTo(knex.fn.now())
  })

  // Stream-users access control list.
  // Controls ownership and permissions.
  await knex.schema.createTable('stream_acl', (table) => {
    table
      .string('userId', 10)
      .references('id')
      .inTable('users')
      .notNullable()
      .onDelete('cascade')
    table
      .string('resourceId', 10)
      .references('id')
      .inTable('streams')
      .notNullable()
      .onDelete('cascade')
    table
      .string('role')
      .references('name')
      .inTable('user_roles')
      .notNullable()
      .onDelete('cascade')
    table.primary(['userId', 'resourceId'])
    table.unique(['userId', 'resourceId'])
  })

  // Objects Table.
  // id - the object's *hash*
  // totalChildrenCount - how many subchildren, regardless of depth, this object has
  // totalChildrenCountByDepth - how many subchildren does this object have at a specific nesting depth.
  // createdAt - date of insertion
  // data - the full object stored as a jsonb representation.
  await knex.schema.createTable('objects', (table) => {
    table.string('id').primary()
    table.string('speckleType', 1024).defaultTo('Base').notNullable()
    table.integer('totalChildrenCount')
    table.jsonb('totalChildrenCountByDepth')
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.jsonb('data')
  })

  // Closure table for tracking the nesting relationships of objects.
  // Note: the usecase optimised for is that when we request an object, we either:
  // a) interactively request/query for its subchildren (sequentially)
  // or
  // b) we want all of it!
  await knex.schema.createTable('object_children_closure', (table) => {
    table.string('parent').notNullable().index()
    table.string('child').notNullable().index()
    table.integer('minDepth').defaultTo(1).notNullable().index()
    table.unique(['parent', 'child'], 'obj_parent_child_index')
    table.index(['parent', 'minDepth'], 'full_pcd_index')
  })

  // Commit table.
  // Any object can be "blessed" as a commit.
  await knex.schema.createTable('commits', (table) => {
    table.string('id', 10).primary()
    table.string('referencedObject').references('id').inTable('objects').notNullable()
    table.string('author', 10).references('id').inTable('users').notNullable()
    table.string('message', 65536).defaultTo('no message')
    table.timestamp('createdAt').defaultTo(knex.fn.now())
  })

  // NOTE: DEPRECATED
  // Table is dropped in later migration.
  await knex.schema.createTable('parent_commits', (table) => {
    table
      .string('parent', 10)
      .references('id')
      .inTable('commits')
      .notNullable()
      .onDelete('cascade')
    table
      .string('child', 10)
      .references('id')
      .inTable('commits')
      .notNullable()
      .onDelete('cascade')
    table.unique(['parent', 'child'], 'commit_parent_child_index')
  })

  // Branches table.
  // A branch is a end-user scope-bound collection of commits.
  await knex.schema.createTable('branches', (table) => {
    table.string('id', 10).primary()
    table
      .string('streamId', 10)
      .references('id')
      .inTable('streams')
      .notNullable()
      .onDelete('cascade')
    table.string('authorId', 10).references('id').inTable('users')
    table.string('name', 512)
    table.string('description', 65536)
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.timestamp('updatedAt').defaultTo(knex.fn.now())
    table.unique(['streamId', 'name'])
  })

  // Junction Table Branches >- -< Commits
  await knex.schema.createTable('branch_commits', (table) => {
    table
      .string('branchId', 10)
      .references('id')
      .inTable('branches')
      .notNullable()
      .onDelete('cascade')
    table
      .string('commitId')
      .references('id')
      .inTable('commits')
      .notNullable()
      .onDelete('cascade')
    table.primary(['branchId', 'commitId'])
  })

  // Flat table to store all commits of a stream.
  // Added here to prevent a n+1 query (would happen if we'd rely to get all commits only from branches)
  await knex.schema.createTable('stream_commits', (table) => {
    table
      .string('streamId', 10)
      .references('id')
      .inTable('streams')
      .notNullable()
      .onDelete('cascade')
    table
      .string('commitId')
      .references('id')
      .inTable('commits')
      .notNullable()
      .onDelete('cascade')
    table.primary(['streamId', 'commitId'])
  })
}

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('server_config')

  await knex.schema.dropTableIfExists('server_acl')
  await knex.schema.dropTableIfExists('stream_acl')
  await knex.schema.dropTableIfExists('user_roles')

  await knex.schema.dropTableIfExists('stream_commits')
  await knex.schema.dropTableIfExists('branch_commits')
  await knex.schema.dropTableIfExists('branches')
  await knex.schema.dropTableIfExists('parent_commits')
  await knex.schema.dropTableIfExists('commits')
  await knex.schema.dropTableIfExists('object_children_closure')

  await knex.schema.dropTableIfExists('objects')
  await knex.schema.dropTableIfExists('streams')

  await knex.schema.dropTableIfExists('token_scopes')
  await knex.schema.dropTableIfExists('scopes')
  await knex.schema.dropTableIfExists('personal_api_tokens')
  await knex.schema.dropTableIfExists('api_tokens')
  await knex.schema.dropTableIfExists('users')

  await knex.raw('DROP TYPE IF EXISTS speckle_reference_type ')
  await knex.raw('DROP TYPE IF EXISTS speckle_acl_role_type ')
}
