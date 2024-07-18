import { WorkspaceAcl } from '@/modules/workspacesCore/domain/types'

export const isUserLastWorkspaceAdmin = (
  workspaceRoles: WorkspaceAcl[],
  userId: string
): boolean => {
  const workspaceAdmins = workspaceRoles.filter(
    ({ role }) => role === 'workspace:admin'
  )
  const isUserAdmin = workspaceAdmins.some((role) => role.userId === userId)

  return isUserAdmin && workspaceAdmins.length === 1
}
