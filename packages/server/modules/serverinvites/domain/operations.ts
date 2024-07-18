import { UserWithOptionalRole } from '@/modules/core/repositories/users'
import {
  ServerInvitesEventsKeys,
  ServerInvitesEventsPayloads
} from '@/modules/serverinvites/domain/events'
import {
  InviteResourceTarget,
  InviteResourceTargetType,
  ServerInviteRecord
} from '@/modules/serverinvites/domain/types'

export type QueryAllUserStreamInvites = (
  userId: string
) => Promise<ServerInviteRecord[]>

type FindStreamInviteArgs = {
  target?: string | null
  token?: string | null
  inviteId?: string | null
}

export type FindStreamInvite = (
  streamId: string,
  args: FindStreamInviteArgs
) => Promise<ServerInviteRecord | null>

export type FindUserByTarget = (target: string) => Promise<UserWithOptionalRole | null>

export type ServerInviteRecordInsertModel = Omit<ServerInviteRecord, 'createdAt'>

export type InsertInviteAndDeleteOld = (
  invite: ServerInviteRecordInsertModel,
  alternateTargets: string[]
) => Promise<{ deleted: number[]; invite: ServerInviteRecord }>

export type FindServerInvite = (
  email?: string,
  token?: string
) => Promise<ServerInviteRecord | null>

export type QueryAllStreamInvites = (streamId: string) => Promise<ServerInviteRecord[]>

export type DeleteAllStreamInvites = (streamId: string) => Promise<boolean>

export type DeleteServerOnlyInvites = (email?: string) => Promise<number | undefined>

export type UpdateAllInviteTargets = (
  oldTargets?: string | string[],
  newTarget?: string
) => Promise<void>

export type DeleteStreamInvite = (inviteId?: string) => Promise<number | undefined>

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

export type FindInvite = (inviteId?: string) => Promise<ServerInviteRecord | null>

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

export type FindInviteByToken = (
  inviteToken?: string
) => Promise<ServerInviteRecord | null>

export type CreateInviteParams = {
  target: string
  inviterId: string
  message?: string | null
  primaryResourceTarget: InviteResourceTarget
}

export type EmitServerInvitesEvent = <TEvent extends ServerInvitesEventsKeys>(args: {
  eventName: TEvent
  payload: ServerInvitesEventsPayloads[TEvent]
}) => Promise<unknown[]>
