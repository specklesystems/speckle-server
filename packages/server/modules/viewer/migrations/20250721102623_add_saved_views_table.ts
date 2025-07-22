import { Knex } from 'knex'

const tableName = 'saved_views'

// TODO: Validate indexing strategy based on queries
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.string('id').notNullable().primary()
    table.string('name').notNullable()
    table.text('description').nullable()
    table
      .string('projectId')
      .notNullable()
      .references('id')
      .inTable('streams')
      .onDelete('CASCADE')
    table
      .string('authorId')
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL') // If the author is deleted, we keep the view but lose the author reference
    table.string('groupName').nullable() // Used for optionally grouping views
    table.specificType('resourceIds', 'varchar(255)[]').notNullable().defaultTo('{}')
    table.boolean('isHomeView').notNullable().defaultTo(false)
    table.string('visibility').defaultTo('public').notNullable() // public, authorOnly
    table.jsonb('viewerState').notNullable() // SerializedViewerState
    table.text('screenshot').notNullable() // Base64 encoded screenshot
    table.double('position').defaultTo(0).notNullable() // Used for manual positioning in the UI

    table
      .timestamp('createdAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
    table
      .timestamp('updatedAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
  })

  // Add unique idx on projectId, name, groupName
  // (+ coalesce NULL to empty string, cause NULL !== NULL IN PGSQL)
  await knex.raw(`
  CREATE UNIQUE INDEX saved_views_projectid_name_groupname_unique_idx
  ON "${tableName}" ("projectId", "name", COALESCE("groupName", ''))
`)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(tableName)
}
