import { WorkspaceAcl } from '@/modules/workspaces/domain/types'
import { Roles } from '@speckle/shared'

export const isUserLastWorkspaceAdmin = (
  workspaceRoles: WorkspaceAcl[],
  userId: string
): boolean => {
  const workspaceAdmins = workspaceRoles.filter(
    ({ role }) => role === Roles.Workspace.Admin
  )
  const isUserAdmin = workspaceAdmins.some((role) => role.userId === userId)

  return isUserAdmin && workspaceAdmins.length === 1
}
