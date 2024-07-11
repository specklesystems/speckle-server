import { StreamRoles, WorkspaceRoles } from '@speckle/shared'

/**
 * Given a user's workspace role, return the role they should have for workspace projects.
 */
export const mapWorkspaceRoleToProjectRole = (
  workspaceRole: WorkspaceRoles
): StreamRoles => {
  switch (workspaceRole) {
    case 'workspace:guest':
    case 'workspace:member':
      return 'stream:reviewer'
    case 'workspace:admin':
      return 'stream:owner'
  }
}
