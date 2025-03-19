import type { AvailableRoles } from '@speckle/shared'
import type { WorkspaceSeatType } from '~/lib/common/generated/gql/graphql'

type BaseSettingsMenuItem = {
  title: string
  disabled?: boolean
  tooltipText?: string
  permission?: AvailableRoles[]
}

export type GenericSettingsMenuItem = BaseSettingsMenuItem & {
  route: string
}

export enum UserUpdateActionTypes {
  RemoveMember = 'remove-member',
  LeaveWorkspace = 'leave-workspace',
  MakeAdmin = 'make-admin',
  RemoveAdmin = 'remove-admin',
  MakeGuest = 'make-guest',
  MakeMember = 'make-member',
  UpgradeEditor = 'upgrade-editor',
  DowngradeEditor = 'downgrade-editor'
}

export type WorkspaceSettingsMenuItem = BaseSettingsMenuItem & {
  name: string
  route: (slug: string) => string
}

export type ShowOptions = {
  isActiveUserWorkspaceAdmin?: boolean
  isActiveUserTargetUser?: boolean
  targetUserCurrentRole?: string
  targetUserCurrentSeatType?: WorkspaceSeatType
}

export type MenuConfig = {
  title: string
  show: (options: ShowOptions) => boolean
}

export type DialogConfig = {
  title: string
  mainMessage: string | ((seatType?: WorkspaceSeatType) => string)
  showRoleInfo?: boolean
  buttonText: string
  seatCountMessage?: boolean
}

export type ActionConfig = {
  menu: MenuConfig
  dialog: DialogConfig
}
