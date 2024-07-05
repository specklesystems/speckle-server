import { Workspace, WorkspaceAcl } from '@/modules/workspaces/domain/types'
import {
  GetWorkspace,
  GetWorkspaceRole,
  UpsertWorkspace,
  UpsertWorkspaceRole
} from '@/modules/workspaces/domain/operations'
import { Knex } from 'knex'
import { Roles } from '@speckle/shared'

const tables = {
  workspaces: (db: Knex) => db<Workspace>('workspaces'),
  workspacesAcl: (db: Knex) => db<WorkspaceAcl>('workspace_acl')
}

export const getWorkspaceFactory =
  ({ db }: { db: Knex }): GetWorkspace =>
  async ({ workspaceId }) => {
    const workspace = await tables
      .workspaces(db)
      .select('*')
      .where('id', '=', workspaceId)
      .first()

    return workspace || null
  }

export const upsertWorkspaceFactory =
  ({ db }: { db: Knex }): UpsertWorkspace =>
  async ({ workspace }) => {
    await tables
      .workspaces(db)
      .insert(workspace)
      .onConflict('id')
      .merge(['description', 'logoUrl', 'name', 'updatedAt'])
  }

export const getWorkspaceRoleFactory =
  ({ db }: { db: Knex }): GetWorkspaceRole =>
  async ({ userId, workspaceId }) => {
    const acl = await tables
      .workspacesAcl(db)
      .select('*')
      .where({ userId, workspaceId })
      .first()

    return acl || null
  }

export const upsertWorkspaceRoleFactory =
  ({ db }: { db: Knex }): UpsertWorkspaceRole =>
  async ({ userId, workspaceId, role }) => {
    const validRoles = Object.values(Roles.Workspace)
    if (!validRoles.includes(role)) {
      throw new Error(`Unexpected workspace role provided: ${role}`)
    }

    await tables
      .workspacesAcl(db)
      .insert({ userId, workspaceId, role })
      .onConflict(['userId', 'workspaceId'])
      .merge(['role'])
  }
