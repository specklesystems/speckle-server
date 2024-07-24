import {
  ProjectInviteResourceType,
  ServerInviteResourceType
} from '@/modules/serverinvites/domain/constants'
import { Nullable } from '@/modules/shared/helpers/typeHelper'
import { ServerRoles, StreamRoles } from '@speckle/shared'

export interface InviteResourceTargetTypeMap {
  project: 'project'
  server: 'server'
}

export type InviteResourceTargetType =
  InviteResourceTargetTypeMap[keyof InviteResourceTargetTypeMap]

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

export type ServerInviteRecord<R extends InviteResourceTarget = InviteResourceTarget> =
  {
    id: string
    target: string
    inviterId: string
    createdAt: Date
    message: Nullable<string>
    resource: R
    token: string
  }
