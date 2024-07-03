import { Workspace, WorkspaceAcl } from '@/modules/workspaces/domain/types'
import {
  DeleteWorkspaceRole,
  GetWorkspace,
  GetWorkspaceProjects,
  GetWorkspaceRole,
  GetWorkspaceRoles,
  UpsertWorkspace,
  UpsertWorkspaceRole
} from '@/modules/workspaces/domain/operations'
import { Knex } from 'knex'
import { Roles } from '@speckle/shared'
import { StreamRecord } from '@/modules/core/helpers/types'

const tables = {
  streams: (db: Knex) => db<StreamRecord>('streams'),
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

export const deleteWorkspaceRoleFactory =
  ({ db }: { db: Knex }): DeleteWorkspaceRole =>
  async ({ userId, workspaceId }) => {
    const workspacesAclTable = tables.workspacesAcl(db)

    // Get current role
    const currentRoleQuery = workspacesAclTable
      .where('userId', userId)
      .and.where('workspaceId', workspaceId)
      .first()
    const currentRole = await currentRoleQuery

    if (!currentRole) {
      return null
    }

    // Protect against removing last admin in workspace
    const workspaceAdmins = await workspacesAclTable.where('role', 'workspace:admin')

    const targetUserIsAdmin = currentRole.role === 'workspace:admin'
    const targetUserIsLastAdmin = workspaceAdmins.length === 1

    if (targetUserIsAdmin && targetUserIsLastAdmin) {
      throw new Error('Cannot remove last admin in workspace.')
    }

    // Perform delete
    await currentRoleQuery.delete()

    return currentRole
  }

export const getWorkspaceMembersFactory =
  ({ db }: { db: Knex }): GetWorkspaceRoles =>
  async ({
    workspaceId,
    roles = ['workspace:admin', 'workspace:member', 'workspace:guest']
  }): Promise<WorkspaceAcl[]> => {
    const memberRoles = await tables
      .workspacesAcl(db)
      .select('*')
      .where('workspaceId', workspaceId)
      .and.whereIn('role', roles)

    return memberRoles
  }

export const getWorkspaceProjectsFactory =
  ({ db }: { db: Knex }): GetWorkspaceProjects =>
  async ({ workspaceId }) => {
    const projects = await tables
      .streams(db)
      .select('*')
      .where('workspaceId', workspaceId)

    return projects
  }

export const upsertWorkspaceRoleFactory =
  ({ db }: { db: Knex }): UpsertWorkspaceRole =>
  async ({ userId, workspaceId, role }) => {
    // Verify requested role is valid workspace role
    const validRoles = Object.values(Roles.Workspace)
    if (!validRoles.includes(role)) {
      throw new Error(`Unexpected workspace role provided: ${role}`)
    }

    const workspacesAclTable = tables.workspacesAcl(db)

    // Protect against removing last admin in workspace
    const workspaceAdmins = await workspacesAclTable.where('role', 'workspace:admin')

    const targetUserIsWorkspaceAdmin = workspaceAdmins.some(
      (acl) => acl.userId === userId
    )
    const targetUserNextRoleIsNotAdmin = role !== 'workspace:admin'
    const targetUserIsLastAdmin = workspaceAdmins.length === 1

    if (
      targetUserIsWorkspaceAdmin &&
      targetUserNextRoleIsNotAdmin &&
      targetUserIsLastAdmin
    ) {
      throw new Error('Cannot remove last admin in workspace.')
    }

    await workspacesAclTable
      .insert({ userId, workspaceId, role })
      .onConflict(['userId', 'workspaceId'])
      .merge(['role'])
  }
