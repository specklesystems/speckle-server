import { Roles, type WorkspaceRoles } from '@speckle/shared'

export type SelectableWorkspaceRole = WorkspaceRoles | 'delete'

export const roleSelectItems: Record<
  SelectableWorkspaceRole | string,
  { id: SelectableWorkspaceRole; title: string }
> = {
  [Roles.Workspace.Admin]: {
    id: Roles.Workspace.Admin,
    title: 'Admin'
  },
  [Roles.Workspace.Member]: {
    id: Roles.Workspace.Member,
    title: 'Can edit'
  },
  [Roles.Workspace.Guest]: {
    id: Roles.Workspace.Guest,
    title: 'Can view'
  },
  ['delete']: {
    id: 'delete',
    title: 'Remove'
  }
}
