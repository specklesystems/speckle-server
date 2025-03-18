import type { AvailableRoles } from '@speckle/shared'

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
  route: (slug: string) => string
}

export enum UserUpdateActionTypes {
  RemoveMember = 'remove-member',
  LeaveWorkspace = 'leave-workspace',
  MakeAdmin = 'make-admin',
  MakeGuest = 'make-guest',
  UpgradeEditor = 'upgrade-editor'
}
