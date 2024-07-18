import {
  ProjectInviteResourceType,
  ServerInviteResourceType
} from '@/modules/serverinvites/domain/constants'
import { Nullable } from '@/modules/shared/helpers/typeHelper'
import { ServerRoles, StreamRoles } from '@speckle/shared'

export type InviteResourceTargetType = 'project' | 'server'

export type InviteResourceTarget<
  T extends InviteResourceTargetType = InviteResourceTargetType,
  R extends string = string
> = {
  resourceId: string
  resourceType: T
  role: R
  /**
   * Whether or not this is the primary target for the invite
   */
  primary: boolean
}

export type ServerInviteResourceTarget = InviteResourceTarget<
  typeof ServerInviteResourceType,
  ServerRoles
>

export type ProjectInviteResourceTarget = InviteResourceTarget<
  typeof ProjectInviteResourceType,
  StreamRoles
>

export type ServerInviteRecord = {
  id: string
  target: string
  inviterId: string
  createdAt: Date
  message: Nullable<string>
  resource: InviteResourceTarget
  token: string
}
