import { WorkspaceRole } from './types.js'

const workspaceRoleWeights: Record<WorkspaceRole, number> = {
  'workspace:admin': 1000,
  'workspace:member': 100,
  'workspace:guest': 50
}

export const isMinimumWorkspaceRole = (
  role: WorkspaceRole,
  targetRole: WorkspaceRole
): boolean => {
  const roleWeight = workspaceRoleWeights[role]
  const targetRoleWeight = workspaceRoleWeights[targetRole]

  if (!roleWeight || !targetRoleWeight) return false

  return roleWeight >= targetRoleWeight
}
