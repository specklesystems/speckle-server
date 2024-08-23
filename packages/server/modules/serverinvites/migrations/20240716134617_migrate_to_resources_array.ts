import { Knex } from 'knex'

const TABLE_NAME = 'server_invites'

const OLD_UNIQUE_IDX_COLS = ['target', 'resourceTarget', 'resourceId']
const OLD_IDX_2 = ['resourceTarget', 'resourceId']

const NEW_IDX = ['resource']
const NEW_UNIQUE_IDX = ['target', 'resource']

export async function up(knex: Knex): Promise<void> {
  // Update all project invites
  const updateQ1 = knex.raw(`
      UPDATE ${TABLE_NAME}
      SET resource = jsonb_build_object('resourceId', "resourceId", 'resourceType', 'project', 'role',
                                        coalesce(role, 'stream:contributor'), 'primary', true)
      WHERE (resource = '{}' OR resource IS NULL)
        AND "resourceTarget" = 'streams'
        AND "resourceId" IS NOT NULL
    `)
  await updateQ1

  // Update all remaining (server) invites
  const updateQ2 = knex.raw(`
    UPDATE ${TABLE_NAME}
    SET resource = jsonb_build_object('resourceId', '', 'resourceType', 'server', 'role',
                                      coalesce("serverRole", 'server:user'), 'primary', true)
    WHERE (resource = '{}' OR resource IS NULL)
      AND "resourceTarget" IS NULL
    `)
  await updateQ2

  // Drop resourceTarget, resourceId, role, serverRole
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropColumn('resourceTarget')
    table.dropColumn('resourceId')
    table.dropColumn('role')
    table.dropColumn('serverRole')

    table.index(NEW_IDX)
    table.index(NEW_UNIQUE_IDX) // not actually a unique idx, cause i'm not super confident about some duplicates not appearing
  })
}

export async function down(knex: Knex): Promise<void> {
  // Remove indices
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropIndex(NEW_IDX)
    table.dropIndex(NEW_UNIQUE_IDX)
  })

  // Add back columns
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.string('resourceTarget', 256)
    table.string('resourceId', 256)
    table.string('role', 256)
    table.string('serverRole')

    table.index(OLD_IDX_2)
    table.unique(OLD_UNIQUE_IDX_COLS)
  })

  // Move back from resource to old fields
  const updateQ = knex.raw(`
    UPDATE ${TABLE_NAME}
    SET resource         = '{}',
        "resourceId"     = CASE
                              WHEN resource ->> 'resourceType' = 'project' THEN resource ->> 'resourceId'
                              ELSE null
            END,
        "role"           = CASE
                              WHEN resource ->> 'resourceType' = 'project' THEN COALESCE(resource ->> 'role', 'stream:contributor')
                              ELSE null
            END,
        "serverRole"     = CASE
                              WHEN resource ->> 'resourceType' = 'project' THEN null
                              ELSE COALESCE(resource ->> 'role', 'server:user')
            END,
        "resourceTarget" = CASE
                              WHEN resource ->> 'resourceType' = 'project' THEN 'streams'
                              ELSE null
            END
    WHERE (NOT (resource = '{}' OR resource IS NULL))
    `)
  await updateQ
}
