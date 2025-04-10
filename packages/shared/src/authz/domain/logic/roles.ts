import {
  StreamRoles,
  ServerRoles,
  RoleInfo,
  WorkspaceRoles
} from '../../../core/constants.js'
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
