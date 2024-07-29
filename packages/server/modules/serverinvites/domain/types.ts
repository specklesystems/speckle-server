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
  ResourceType extends InviteResourceTargetType = InviteResourceTargetType,
  RoleType extends string = string
> = {
  resourceId: string
  resourceType: ResourceType
  role: RoleType
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

export type ServerInviteRecord<
  Resource extends InviteResourceTarget = InviteResourceTarget
> = {
  id: string
  target: string
  inviterId: string
  createdAt: Date
  message: Nullable<string>
  resource: Resource
  token: string
}
