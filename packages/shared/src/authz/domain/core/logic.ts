import { ServerRoles, RoleInfo } from '../../../core/constants.js'
import { InvalidRoleError } from '../errors.js'

export const isMinimumServerRole = (
  role: ServerRoles,
  targetRole: ServerRoles
): boolean => {
  if (!(role in RoleInfo.Server)) {
    throw new InvalidRoleError(`Invalid role ${role}`)
  }
  if (!(targetRole in RoleInfo.Server)) {
    throw new InvalidRoleError(`Invalid target role ${targetRole}`)
  }
  const roleWeight = RoleInfo.Server[role].weight
  const targetRoleWeight = RoleInfo.Server[targetRole].weight
  return roleWeight >= targetRoleWeight
}
