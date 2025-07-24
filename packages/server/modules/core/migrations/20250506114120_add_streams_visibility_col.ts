import type { Knex } from 'knex'

const tableName = 'streams'
const isPublicCol = 'isPublic'
// const isDiscoverableCol = 'isDiscoverable'
const visibilityCol = 'visibility'
const workspaceIdCol = 'workspaceId'

export async function up(knex: Knex): Promise<void> {
  // Add new col
  await knex.schema.alterTable(tableName, (table) => {
    table.string(visibilityCol).defaultTo('private').notNullable()
  })

  // Migrate isPublic -> visibility
  await knex.raw(`
    UPDATE "${tableName}"
    SET "${visibilityCol}" = 
      CASE
        WHEN "${isPublicCol}" = true THEN 'public'
        WHEN "${isPublicCol}" = false AND "${workspaceIdCol}" IS NULL THEN 'private'
        WHEN "${isPublicCol}" = false AND "${workspaceIdCol}" IS NOT NULL THEN 'workspace'
      END;
    `)

  // // Drop old cols - Do this separately to avoid backwards incompatible changes
  // await knex.schema.alterTable(tableName, (table) => {
  //   table.dropColumn(isPublicCol)
  //   table.dropColumn(isDiscoverableCol)
  // })
}

export async function down(knex: Knex): Promise<void> {
  // // Re-introduce old cols
  // await knex.schema.alterTable(tableName, (table) => {
  //   table.boolean(isPublicCol).defaultTo(true)
  //   table.boolean(isDiscoverableCol).defaultTo(false).notNullable()
  // })

  // Migrate visibility -> isPublic
  await knex.raw(`
    UPDATE "${tableName}"
    SET "${isPublicCol}" = 
      CASE
        WHEN "${visibilityCol}" = 'public' THEN true
        WHEN "${visibilityCol}" = 'private' THEN false
        WHEN "${visibilityCol}" = 'workspace' THEN false
      END;
    `)

  // Drop new col
  await knex.schema.alterTable(tableName, (table) => {
    table.dropColumn(visibilityCol)
  })
}
