import { Roles, StreamRoles, WorkspaceRoles } from '@speckle/shared'

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
