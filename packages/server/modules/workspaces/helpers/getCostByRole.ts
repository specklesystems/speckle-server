import {
  WORKSPACE_COST_ADMIN,
  WORKSPACE_COST_MEMBER,
  WORKSPACE_COST_GUEST,
  WORKSPACE_COST_VIEWER
} from '@/modules/workspaces/domain/constants'
import { WorkspaceInvalidRoleError } from '@/modules/workspaces/errors/workspace'

const rolesCostMap = new Map<'admins' | 'members' | 'guests' | 'viewers', number>([
  ['admins', WORKSPACE_COST_ADMIN],
  ['members', WORKSPACE_COST_MEMBER],
  ['guests', WORKSPACE_COST_GUEST],
  ['viewers', WORKSPACE_COST_VIEWER]
])

export const getCostByRole = (
  role: 'admins' | 'members' | 'guests' | 'viewers'
): number => {
  if (!rolesCostMap.has(role)) {
    throw new WorkspaceInvalidRoleError()
  }
  return rolesCostMap.get(role)!
}
