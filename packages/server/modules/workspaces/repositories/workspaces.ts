import { Workspace, WorkspaceAcl } from '@/modules/workspaces/domain/types'
import {
  GetWorkspace,
  GetWorkspaceRole,
  UpsertWorkspace,
  UpsertWorkspaceRole
} from '@/modules/workspaces/domain/operations'
import { Knex } from 'knex'

const workspaceTableName = 'workspaces'

export const upsertWorkspaceFactory =
  ({ db }: { db: Knex }): UpsertWorkspace =>
  async ({ workspace }) => {
    await db<Workspace>(workspaceTableName)
      .insert(workspace)
      .onConflict('id')
      .merge(['description', 'logoUrl', 'name', 'updatedAt'])
  }

export const getWorkspaceFactory =
  ({ db }: { db: Knex }): GetWorkspace =>
  async ({ workspaceId }) => {
    const workspace = await db<Workspace>(workspaceTableName)
      .select('*')
      .where('id', '=', workspaceId)
      .first()

    return workspace || null
  }

const workspaceAclTableName = 'workspaces'

export const upsertWorkspaceRoleFactory =
  ({ db }: { db: Knex }): UpsertWorkspaceRole =>
  async (workspaceAcl) => {
    await db<WorkspaceAcl>(workspaceAclTableName)
      .insert(workspaceAcl)
      .onConflict(['userId', 'workspaceId'])
      .merge(['role'])
  }

export const getWorkspaceRoleFactory =
  ({ db }: { db: Knex }): GetWorkspaceRole =>
  async ({ userId, workspaceId }) => {
    const acl = await db<WorkspaceAcl>(workspaceAclTableName)
      .select('*')
      .where({ userId, workspaceId })
      .first()

    return acl || null
  }
