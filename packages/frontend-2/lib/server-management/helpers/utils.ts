import { Roles } from '@speckle/shared/src/core/constants'
import { UserItem, ProjectItem } from '~~/lib/server-management/helpers/types'
import { has } from 'lodash-es'
import { ServerRoles } from '@speckle/shared'

export const roleLookupTable = {
  [Roles.Server.User]: 'User',
  [Roles.Server.Admin]: 'Admin',
  [Roles.Server.ArchivedUser]: 'Archived',
  [Roles.Server.Guest]: 'Guest'
}

export const getRoleLabel = (role: keyof typeof roleLookupTable) => {
  return roleLookupTable[role] || role.split(':')[1]
}

export const isUser = (
  val: UserItem | ProjectItem
): val is UserItem & { role: ServerRoles } => {
  if (has(val, 'email')) return true
  throw new Error('Unexpectedly item is not a user!')
}

export const isProject = (val: UserItem | ProjectItem): val is ProjectItem => {
  if (has(val, 'models')) return true
  throw new Error('Unexpectedly item is not a project!')
}
