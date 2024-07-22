import { UserWithOptionalRole } from '@/modules/core/repositories/users'
import { ServerInvitesEventsKeys } from '@/modules/serverinvites/domain/events'
import {
  InviteResourceTarget,
  InviteResourceTargetType,
  ServerInviteRecord
} from '@/modules/serverinvites/domain/types'
import { ServerInviteResourceFilter } from '@/modules/serverinvites/repositories/serverInvites'
import { EventBusPayloads } from '@/modules/shared/services/eventBus'

export type FindUserByTarget = (target: string) => Promise<UserWithOptionalRole | null>

export type ServerInviteRecordInsertModel = Omit<ServerInviteRecord, 'createdAt'>

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
  T extends InviteResourceTargetType = InviteResourceTargetType,
  R extends string = string
>(params: {
  userId: string
  resourceType: T
}) => Promise<ServerInviteRecord<InviteResourceTarget<T, R>>[]>

export type QueryAllResourceInvites = <
  T extends InviteResourceTargetType = InviteResourceTargetType,
  R extends string = string
>(
  filter: Pick<InviteResourceTarget<T, R>, 'resourceId' | 'resourceType'>
) => Promise<ServerInviteRecord<InviteResourceTarget<T, R>>[]>

export type DeleteAllResourceInvites = <
  T extends InviteResourceTargetType = InviteResourceTargetType,
  R extends string = string
>(
  filter: Pick<InviteResourceTarget<T, R>, 'resourceId' | 'resourceType'>
) => Promise<boolean>

export type FindInvite = <
  T extends InviteResourceTargetType = InviteResourceTargetType,
  R extends string = string
>(params: {
  inviteId?: string
  token?: string
  target?: string
  resourceFilter?: ServerInviteResourceFilter<T, R>
}) => Promise<ServerInviteRecord<InviteResourceTarget<T, R>> | null>

export type FindInviteByToken = (params: {
  token: string
}) => Promise<ServerInviteRecord | null>

export type DeleteResourceInvite = (params: {
  inviteId: string
  resourceType: InviteResourceTargetType
}) => Promise<number | undefined>

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
  primaryResourceTarget: InviteResourceTarget
}

export type EmitServerInvitesEvent = <TEvent extends ServerInvitesEventsKeys>(args: {
  eventName: TEvent
  payload: EventBusPayloads[TEvent]
}) => Promise<unknown[]>
