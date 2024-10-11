import {
  ProjectInviteResourceType,
  ServerInviteResourceType
} from '@/modules/serverinvites/domain/constants'
import { ResourceTargetTypeRoleTypeMap } from '@/modules/serverinvites/helpers/core'
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
}

export type PrimaryInviteResourceTarget<
  Resource extends InviteResourceTarget = InviteResourceTarget
> = Resource & {
  /**
   * Marks the resource target as the primary, the one that will stored in the DB
   */
  primary: true

  /**
   * If invite also has secondary resource targets, you can specify the expected roles here
   */
  secondaryResourceRoles?: Partial<ResourceTargetTypeRoleTypeMap>
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
  updatedAt: Date
  message: Nullable<string>
  resource: PrimaryInviteResourceTarget<Resource>
  token: string
}
