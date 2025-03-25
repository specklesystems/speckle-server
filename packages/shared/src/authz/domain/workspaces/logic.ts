import { RoleInfo, WorkspaceRoles } from '../../../core/constants.js'
import { InvalidRoleError } from '../errors.js'

export const isMinimumWorkspaceRole = (
  role: WorkspaceRoles,
  targetRole: WorkspaceRoles
): boolean => {
  if (!(role in RoleInfo.Workspace)) {
    throw new InvalidRoleError(`Invalid role ${role}`)
  }
  if (!(targetRole in RoleInfo.Workspace)) {
    throw new InvalidRoleError(`Invalid target role ${targetRole}`)
  }
  const roleWeight = RoleInfo.Workspace[role].weight
  const targetRoleWeight = RoleInfo.Workspace[targetRole].weight

  return roleWeight >= targetRoleWeight
}
