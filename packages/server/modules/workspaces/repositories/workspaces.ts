import { Workspace, WorkspaceAcl } from '@/modules/workspaces/domain/types'
import {
  DeleteWorkspaceRole,
  GetWorkspace,
  GetWorkspaceRoleForUser,
  GetWorkspaceRoles,
  GetWorkspaceRolesForUser,
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

export const getWorkspaceRolesFactory =
  ({ db }: { db: Knex }): GetWorkspaceRoles =>
  async ({ workspaceId }) => {
    return await tables.workspacesAcl(db).select('*').where({ workspaceId })
  }

export const getWorkspaceRoleForUserFactory =
  ({ db }: { db: Knex }): GetWorkspaceRoleForUser =>
  async ({ userId, workspaceId }) => {
    return (
      (await tables
        .workspacesAcl(db)
        .select('*')
        .where({ userId, workspaceId })
        .first()) ?? null
    )
  }

export const getWorkspaceRolesForUserFactory =
  ({ db }: { db: Knex }): GetWorkspaceRolesForUser =>
  async ({ userId }, options) => {
    const workspaceIdFilter = options?.workspaceIdFilter ?? []

    const query = tables.workspacesAcl(db).select('*').where({ userId })

    if (workspaceIdFilter.length > 0) {
      query.whereIn('workspaceId', workspaceIdFilter)
    }

    return await query
  }

const isUserLastWorkspaceAdmin = (
  workspaceRoles: WorkspaceAcl[],
  userId: string
): boolean => {
  const workspaceAdmins = workspaceRoles.filter(
    ({ role }) => role === 'workspace:admin'
  )
  const isUserAdmin = workspaceAdmins.some((role) => role.userId === userId)

  return isUserAdmin && workspaceAdmins.length === 1
}

export const deleteWorkspaceRoleFactory =
  ({ db }: { db: Knex }): DeleteWorkspaceRole =>
  async ({ userId, workspaceId }) => {
    // Protect against removing last admin in workspace
    const workspaceRoles = await getWorkspaceRolesFactory({ db })({ workspaceId })

    if (isUserLastWorkspaceAdmin(workspaceRoles, userId)) {
      throw new Error('Cannot remove last admin in workspace.')
    }

    // Bail early if user has no role
    const currentRole = workspaceRoles.find((role) => role.userId === userId)

    if (!currentRole) {
      return null
    }

    // Perform delete
    await tables.workspacesAcl(db).where({ workspaceId, userId }).delete()

    return currentRole ?? null
  }

export const upsertWorkspaceRoleFactory =
  ({ db }: { db: Knex }): UpsertWorkspaceRole =>
  async ({ userId, workspaceId, role }) => {
    // Verify requested role is valid workspace role
    const validRoles = Object.values(Roles.Workspace)
    if (!validRoles.includes(role)) {
      throw new Error(`Unexpected workspace role provided: ${role}`)
    }

    // Protect against removing last admin in workspace
    const workspaceRoles = await getWorkspaceRolesFactory({ db })({ workspaceId })

    if (
      isUserLastWorkspaceAdmin(workspaceRoles, userId) &&
      role !== 'workspace:admin'
    ) {
      throw new Error('Cannot remove last admin in workspace.')
    }

    await tables
      .workspacesAcl(db)
      .insert({ userId, workspaceId, role })
      .onConflict(['userId', 'workspaceId'])
      .merge(['role'])
  }
