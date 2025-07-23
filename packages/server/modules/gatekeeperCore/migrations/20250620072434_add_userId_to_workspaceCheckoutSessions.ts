import type { Knex } from 'knex'

const TABLE_NAME = 'workspace_checkout_sessions'
const COLUMN_NAME = 'userId'
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.string(COLUMN_NAME).nullable()
  })

  // only on migration we are assuming its a random workspace admin who created the session
  // these are ongoing sessions, wont be recorded as activity
  const workspaceIds: { workspaceId: string }[] = await knex
    .select('workspaceId')
    .from(TABLE_NAME)

  const admins: { workspaceId: string; userId: string }[] = await knex
    .select('workspace_acl.workspaceId', 'workspace_acl.userId')
    .from('workspace_acl')
    .where({ role: 'workspace:admin' })
    .join(
      'workspace_checkout_sessions',
      'workspace_acl.workspaceId',
      'workspace_checkout_sessions.workspaceId'
    )

  for (const { workspaceId } of workspaceIds) {
    const admin = admins.find((a) => a.workspaceId === workspaceId)
    await knex(TABLE_NAME)
      .update({ [COLUMN_NAME]: admin?.userId || '' }) // fallback to empty string if no admin found (should not happen)
      .where({ workspaceId })
  }

  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.string(COLUMN_NAME).notNullable().alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropColumn(COLUMN_NAME)
  })
}
