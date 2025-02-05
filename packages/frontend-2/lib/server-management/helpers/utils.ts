import type {
  UserItem,
  ProjectItem,
  InviteItem
} from '~~/lib/server-management/helpers/types'
import { has } from 'lodash-es'
import { RoleInfo } from '@speckle/shared'
import type { ServerRoles } from '@speckle/shared'

export const roleLookupTable = RoleInfo.Server

export const getRoleLabel = (role: keyof typeof roleLookupTable) =>
  roleLookupTable[role] ? roleLookupTable[role].title : role.split(':')[1]

export const isUser = (
  val: UserItem | ProjectItem | InviteItem
): val is UserItem & { role: ServerRoles } => {
  if (has(val, 'company')) return true
  throw new Error('Unexpectedly item is not a user!')
}

export const isProject = (
  val: UserItem | ProjectItem | InviteItem
): val is ProjectItem => {
  if (has(val, 'models')) return true
  throw new Error('Unexpectedly item is not a project!')
}

export const isInvite = (
  val: UserItem | ProjectItem | InviteItem
): val is InviteItem => {
  if (has(val, 'invitedBy')) return true
  throw new Error('Unexpectedly item is not a Invite!')
}
