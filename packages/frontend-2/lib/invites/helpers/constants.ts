import type { InviteServerItem } from '~~/lib/invites/helpers/types'
import { Roles } from '@speckle/shared'

export const emptyInviteServerItem: InviteServerItem = {
  email: '',
  serverRole: Roles.Server.User,
  project: undefined
}
