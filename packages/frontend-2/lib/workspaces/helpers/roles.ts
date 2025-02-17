import { Roles, type WorkspaceRoles, RoleInfo } from '@speckle/shared'
import { WorkspaceRole } from '~/lib/common/generated/gql/graphql'

export type SelectableWorkspaceRole = WorkspaceRoles | 'delete'
export type SelectableWorkspaceRoleSelectItem = {
  id: SelectableWorkspaceRole
  title: string
  description?: string
}

export const roleSelectItems: Record<
  SelectableWorkspaceRole | string,
  SelectableWorkspaceRoleSelectItem
> = {
  [Roles.Workspace.Admin]: {
    id: Roles.Workspace.Admin,
    title: RoleInfo.Workspace[Roles.Workspace.Admin].title,
    description: RoleInfo.Workspace[Roles.Workspace.Admin].description
  },
  [Roles.Workspace.Member]: {
    id: Roles.Workspace.Member,
    title: RoleInfo.Workspace[Roles.Workspace.Member].title,
    description: RoleInfo.Workspace[Roles.Workspace.Member].description
  },
  [Roles.Workspace.Guest]: {
    id: Roles.Workspace.Guest,
    title: RoleInfo.Workspace[Roles.Workspace.Guest].title,
    description: RoleInfo.Workspace[Roles.Workspace.Guest].description
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
