import { Roles, StreamRoles, WorkspaceRoles } from '@speckle/shared'
import { WorkspaceAcl } from '@/modules/workspacesCore/domain/types'
import { WorkspaceRole } from '@/modules/core/graph/generated/graphql'

export const isUserLastWorkspaceAdmin = (
  workspaceRoles: WorkspaceAcl[],
  userId: string
): boolean => {
  const workspaceAdmins = workspaceRoles.filter(
    ({ role }) => role === Roles.Workspace.Admin
  )
  const isUserAdmin = workspaceAdmins.some((role) => role.userId === userId)

  return isUserAdmin && workspaceAdmins.length === 1
}

/**
 * Given a user's workspace role, return the role they should have for workspace projects.
 */
export const mapWorkspaceRoleToProjectRole = (
  workspaceRole: WorkspaceRoles
): StreamRoles => {
  switch (workspaceRole) {
    case Roles.Workspace.Guest:
    case Roles.Workspace.Member:
      return Roles.Stream.Reviewer
    case Roles.Workspace.Admin:
      return Roles.Stream.Owner
  }
}

export const mapGqlWorkspaceRoleToMainRole = (
  gqlRole: WorkspaceRole
): WorkspaceRoles => {
  switch (gqlRole) {
    case WorkspaceRole.Admin:
      return Roles.Workspace.Admin
    case WorkspaceRole.Member:
      return Roles.Workspace.Member
    case WorkspaceRole.Guest:
      return Roles.Workspace.Guest
  }
}

export const isWorkspaceRole = (role: string): role is WorkspaceRoles => {
  return (Object.values(Roles.Workspace) as string[]).includes(role)
}
