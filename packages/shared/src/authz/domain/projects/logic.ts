import { StreamRoles, RoleInfo } from '../../../core/constants.js'

export const isMinimumProjectRole = (
  role: StreamRoles,
  targetRole: StreamRoles
): boolean => {
  const roleWeight = RoleInfo.Stream[role].weight
  const targetRoleWeight = RoleInfo.Stream[targetRole].weight
  return roleWeight >= targetRoleWeight
}
