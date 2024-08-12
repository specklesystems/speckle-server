import { UserWithOptionalRole } from '@/modules/core/repositories/users'
import {
  InviteResourceTarget,
  InviteResourceTargetType,
  PrimaryInviteResourceTarget,
  ServerInviteRecord
} from '@/modules/serverinvites/domain/types'
import { ServerInviteResourceFilter } from '@/modules/serverinvites/repositories/serverInvites'

export type FindUserByTarget = (target: string) => Promise<UserWithOptionalRole | null>

export type ServerInviteRecordInsertModel = Omit<
  ServerInviteRecord,
  'createdAt' | 'updatedAt'
>

export type InsertInviteAndDeleteOld = (
  invite: ServerInviteRecordInsertModel,
  alternateTargets?: string[]
) => Promise<{ deleted: number; invite: ServerInviteRecord }>

export type FindServerInvite = (
  email?: string,
  token?: string
) => Promise<ServerInviteRecord | null>

export type DeleteServerOnlyInvites = (email?: string) => Promise<number | undefined>

export type UpdateAllInviteTargets = (
  oldTargets?: string | string[],
  newTarget?: string
) => Promise<void>

export type CountServerInvites = (searchQuery: string | null) => Promise<number>

export type FindServerInvites = (
  searchQuery: string | null,
  limit: number,
  offset: number
) => Promise<ServerInviteRecord[]>

export type QueryServerInvites = (
  searchQuery: string | null,
  limit: number,
  cursor: Date | null
) => Promise<ServerInviteRecord[]>

export type QueryAllUserResourceInvites = <
  TargetType extends InviteResourceTargetType = InviteResourceTargetType,
  RoleType extends string = string
>(params: {
  userId: string
  resourceType: TargetType
}) => Promise<ServerInviteRecord<InviteResourceTarget<TargetType, RoleType>>[]>

export type QueryAllResourceInvites = <
  TargetType extends InviteResourceTargetType = InviteResourceTargetType,
  RoleType extends string = string
>(
  filter: Pick<
    InviteResourceTarget<TargetType, RoleType>,
    'resourceId' | 'resourceType'
  > & { search?: string }
) => Promise<ServerInviteRecord<InviteResourceTarget<TargetType, RoleType>>[]>

export type DeleteAllResourceInvites = <
  TargetType extends InviteResourceTargetType = InviteResourceTargetType,
  RoleType extends string = string
>(
  filter: Pick<
    InviteResourceTarget<TargetType, RoleType>,
    'resourceId' | 'resourceType'
  >
) => Promise<boolean>

export type FindInvite = <
  TargetType extends InviteResourceTargetType = InviteResourceTargetType,
  RoleType extends string = string
>(params: {
  inviteId?: string
  token?: string
  target?: string
  resourceFilter?: ServerInviteResourceFilter<TargetType, RoleType>
}) => Promise<ServerInviteRecord<InviteResourceTarget<TargetType, RoleType>> | null>

export type FindInviteByToken = (params: {
  token: string
}) => Promise<ServerInviteRecord | null>

export type DeleteInvite = (inviteId?: string) => Promise<boolean>

export type DeleteInvitesByTarget = (
  targets: string | string[],
  resourceType: InviteResourceTargetType,
  resourceId: string
) => Promise<boolean>

export type QueryInvites = (
  inviteIds?: readonly string[]
) => Promise<ServerInviteRecord[]>

export type DeleteAllUserInvites = (userId: string) => Promise<boolean>

export type CreateInviteParams = {
  target: string
  inviterId: string
  message?: string | null
  primaryResourceTarget: PrimaryInviteResourceTarget
}

export type MarkInviteUpdated = (params: { inviteId: string }) => Promise<boolean>
