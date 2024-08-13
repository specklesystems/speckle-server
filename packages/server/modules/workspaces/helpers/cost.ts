import { WorkspaceRoles } from '@speckle/shared'
import { WorkspaceInvalidRoleError } from '@/modules/workspaces/errors/workspace'

export const WORKSPACE_ADMIN_COST = 50
export const WORKSPACE_MEMBER_COST = 50
export const WORKSPACE_GUEST_COST = 10

const rolesCostMap = new Map<WorkspaceRoles, number>([
  ['workspace:admin', WORKSPACE_ADMIN_COST],
  ['workspace:member', WORKSPACE_MEMBER_COST],
  ['workspace:guest', WORKSPACE_GUEST_COST]
])

export const getCostByWorkspaceRole = (role: WorkspaceRoles) => {
  const cost = rolesCostMap.get(role)

  if (!cost) {
    throw new WorkspaceInvalidRoleError()
  }

  return cost
}
