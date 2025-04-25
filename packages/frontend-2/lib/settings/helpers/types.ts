import type { AvailableRoles, WorkspaceSeatType } from '@speckle/shared'

type BaseSettingsMenuItem = {
  title: string
  disabled?: boolean
  tooltipText?: string
  permission?: AvailableRoles[]
}

export type GenericSettingsMenuItem = BaseSettingsMenuItem & {
  route: string
}

export type WorkspaceSettingsMenuItem = BaseSettingsMenuItem & {
  name: string
  route: (slug?: string) => string
}

export enum WorkspaceUserActionTypes {
  RemoveFromWorkspace = 'remove-from-workspace',
  LeaveWorkspace = 'leave-workspace',
  MakeAdmin = 'make-admin',
  RemoveAdmin = 'remove-admin',
  MakeGuest = 'make-guest',
  MakeMember = 'make-member',
  UpgradeEditor = 'upgrade-editor',
  DowngradeEditor = 'downgrade-editor',
  UpdateProjectPermissions = 'update-project-permissions'
}

export type WorkspaceUserUpdateShowOptions = {
  isActiveUserWorkspaceAdmin?: boolean
  isActiveUserTargetUser?: boolean
  targetUserCurrentRole?: string
  targetUserCurrentSeatType?: WorkspaceSeatType
  isDomainCompliant?: boolean
}
