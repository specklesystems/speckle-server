import type { Knex } from 'knex'

const viewsTable = 'saved_views'
const groupsTable = 'saved_view_groups'

// TODO: Validate indexing strategy based on queries
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(groupsTable, (table) => {
    table.string('id').notNullable().primary()
    table.string('name').notNullable()
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
    table.specificType('resourceIds', 'varchar(255)[]').notNullable().defaultTo('{}')
    table
      .timestamp('createdAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
    table
      .timestamp('updatedAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
  })

  await knex.schema.createTable(viewsTable, (table) => {
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
    table
      .string('groupId')
      .nullable()
      .references('id')
      .inTable(groupsTable)
      .onDelete('SET NULL') // If group deleted, ungroup

    table.specificType('resourceIds', 'varchar(255)[]').notNullable().defaultTo('{}')
    table
      .specificType('groupResourceIds', 'varchar(255)[]')
      .notNullable()
      .defaultTo('{}')
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
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(viewsTable)
  await knex.schema.dropTableIfExists(groupsTable)
}
