import { StreamRoles, RoleInfo } from '../../../core/constants.js'
import { InvalidRoleError } from '../errors.js'

export const isMinimumProjectRole = (
  role: StreamRoles,
  targetRole: StreamRoles
): boolean => {
  if (!(role in RoleInfo.Stream)) {
    throw new InvalidRoleError(`Invalid role ${role}`)
  }
  if (!(targetRole in RoleInfo.Stream)) {
    throw new InvalidRoleError(`Invalid target role ${targetRole}`)
  }
  const roleWeight = RoleInfo.Stream[role].weight
  const targetRoleWeight = RoleInfo.Stream[targetRole].weight
  return roleWeight >= targetRoleWeight
}
