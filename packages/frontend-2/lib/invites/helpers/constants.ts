import type {
  InviteServerItem,
  InviteWorkspaceItem,
  InviteProjectItem
} from '~~/lib/invites/helpers/types'
import { Roles } from '@speckle/shared'

export const emptyInviteServerItem: InviteServerItem = {
  email: '',
  serverRole: Roles.Server.User,
  project: undefined
}

export const emptyInviteProjectItem: InviteProjectItem = {
  email: '',
  serverRole: Roles.Server.User,
  projectRole: Roles.Stream.Contributor,
  project: undefined
}

export const emptyInviteWorkspaceItem: InviteWorkspaceItem = {
  email: '',
  workspaceRole: undefined,
  projectRole: undefined,
  serverRole: undefined,
  matchesDomainPolicy: undefined
}
