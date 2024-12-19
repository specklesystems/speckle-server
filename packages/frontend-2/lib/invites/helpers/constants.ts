import type { InviteServerItem, InviteGenericItem } from '~~/lib/invites/helpers/types'
import { Roles } from '@speckle/shared'

export const emptyInviteServerItem: InviteServerItem = {
  email: '',
  serverRole: Roles.Server.User,
  project: undefined
}

export const emptyInviteGenericItem: InviteGenericItem = {
  email: '',
  workspaceRole: undefined,
  projectRole: undefined,
  serverRole: undefined,
  matchesDomainPolicy: undefined
}
