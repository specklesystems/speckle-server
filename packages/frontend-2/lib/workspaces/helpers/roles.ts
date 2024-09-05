import { Roles, type WorkspaceRoles } from '@speckle/shared'
import { WorkspaceRole } from '~/lib/common/generated/gql/graphql'

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
    title: 'Member'
  },
  [Roles.Workspace.Guest]: {
    id: Roles.Workspace.Guest,
    title: 'Guest'
  },
  ['delete']: {
    id: 'delete',
    title: 'Remove'
  }
}

export const mapMainRoleToGqlWorkspaceRole = (role: WorkspaceRoles): WorkspaceRole => {
  switch (role) {
    case Roles.Workspace.Admin:
      return WorkspaceRole.Admin
    case Roles.Workspace.Member:
      return WorkspaceRole.Member
    case Roles.Workspace.Guest:
      return WorkspaceRole.Guest
  }
}
