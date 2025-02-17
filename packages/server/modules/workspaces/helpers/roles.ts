import { Roles, WorkspaceRoles } from '@speckle/shared'
import { WorkspaceAcl } from '@/modules/workspacesCore/domain/types'
import { WorkspaceRole } from '@/modules/core/graph/generated/graphql'

export const isUserLastWorkspaceAdmin = (
  workspaceRoles: Pick<WorkspaceAcl, 'userId' | 'role'>[],
  userId: string
): boolean => {
  const workspaceAdmins = workspaceRoles.filter(
    ({ role }) => role === Roles.Workspace.Admin
  )
  const isUserAdmin = workspaceAdmins.some((role) => role.userId === userId)

  return isUserAdmin && workspaceAdmins.length === 1
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
