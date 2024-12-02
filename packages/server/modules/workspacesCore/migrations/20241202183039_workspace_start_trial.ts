import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // there aren't that many workspaces.
  const workspaceIds = await knex<{ id: string }>('workspaces').select('id')
  const createdAt = new Date()
  const workspacePlans = workspaceIds.map(({ id }) => ({
    workspaceId: id,
    name: 'starter',
    status: 'trial',
    createdAt
  }))

  if (workspaceIds.length)
    await knex('workspace_plans').insert(workspacePlans).onConflict().ignore()
}

export async function down(): Promise<void> {}
