import { RoleInfo, WorkspaceRoles } from '../../../core/constants.js'

export const isMinimumWorkspaceRole = (
  role: WorkspaceRoles,
  targetRole: WorkspaceRoles
): boolean => {
  const roleWeight = RoleInfo.Workspace[role].weight
  const targetRoleWeight = RoleInfo.Workspace[targetRole].weight

  return roleWeight >= targetRoleWeight
}
