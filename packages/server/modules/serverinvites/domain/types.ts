import type { Project } from '@/modules/core/domain/streams/types'
import type {
  ProjectInviteResourceType,
  ServerInviteResourceType
} from '@/modules/serverinvites/domain/constants'
import type { ResourceTargetTypeRoleTypeMap } from '@/modules/serverinvites/helpers/core'
import type { Nullable } from '@/modules/shared/helpers/typeHelper'
import type {
  Workspace,
  WorkspaceSeatType
} from '@/modules/workspacesCore/domain/types'
import type { ServerRoles, StreamRoles } from '@speckle/shared'

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

  /**
   * Whether the invite should be auto accepted or not. If this is true, no invite is actually created or email sent,
   * and the accept process is done automatically without user involvement.
   */
  autoAccept?: boolean

  /**
   * If invite causes the user to join a workspace, this should be the assigned seat type
   */
  workspaceSeatType?: WorkspaceSeatType
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

export type ExtendedInvite<
  Resource extends InviteResourceTarget = InviteResourceTarget
> = ServerInviteRecord<Resource> & {
  workspace?: Workspace
  project?: Project
}
