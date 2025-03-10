import { ProjectRole } from './types.js'

const projectRoleWeights: Record<ProjectRole, number> = {
  'stream:owner': 1000,
  'stream:contributor': 500,
  'stream:reviewer': 100,
  'stream:guest': 50
}

export const isMinimumProjectRole = (
  role: ProjectRole,
  targetRole: ProjectRole
): boolean => {
  const roleWeight = projectRoleWeights[role]
  const targetRoleWeight = projectRoleWeights[targetRole]

  // TODO: BaseError in shared module?
  if (!roleWeight || !targetRoleWeight) return false

  return roleWeight >= targetRoleWeight
}
