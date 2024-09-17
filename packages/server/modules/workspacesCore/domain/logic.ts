import { WorkspaceDefaultProjectRole } from '@/modules/workspacesCore/domain/types'

export const isWorkspaceDefaultProjectRole = (
  role?: string | null
): role is WorkspaceDefaultProjectRole => {
  const validRoles = ['stream:reviewer', 'stream:contributor']
  return !!role && validRoles.includes(role)
}
