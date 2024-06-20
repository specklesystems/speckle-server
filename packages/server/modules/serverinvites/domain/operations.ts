import { ServerRoles, StreamRoles } from '@speckle/shared'
import { UserWithOptionalRole } from '@/modules/core/repositories/users'
import { ResourceTargets } from '@/modules/serverinvites/helpers/inviteHelper'
import {
  ServerInviteRecord,
  StreamInviteRecord
} from '@/modules/serverinvites/domain/types'
import { StreamWithOptionalRole } from '@/modules/core/repositories/streams'

export type QueryAllUserStreamInvites = (
  userId: string
) => Promise<StreamInviteRecord[]>

type FindStreamInviteArgs = {
  target?: string | null
  token?: string | null
  inviteId?: string | null
}

export type FindStreamInvite = (
  streamId: string,
  args: FindStreamInviteArgs
) => Promise<StreamInviteRecord | null>

export type FindUserByTarget = (target: string) => Promise<UserWithOptionalRole | null>

type Invite = {
  resourceId?: string | null
  resourceTarget?: typeof ResourceTargets.Streams | null
}

export type FindResource = (
  args: Invite
) => Promise<StreamWithOptionalRole | undefined | null>

type ServerInviteRecordInsertModel = Pick<
  ServerInviteRecord,
  | 'id'
  | 'target'
  | 'inviterId'
  | 'message'
  | 'resourceTarget'
  | 'resourceId'
  | 'role'
  | 'token'
  | 'serverRole'
>

export type InsertInviteAndDeleteOld = (
  invite: ServerInviteRecordInsertModel,
  alternateTargets: string[]
) => Promise<number[]>

export type FindServerInvite = (
  email?: string,
  token?: string
) => Promise<ServerInviteRecord | null>

export type QueryAllStreamInvites = (streamId: string) => Promise<StreamInviteRecord[]>

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
  targets?: string | string[],
  resourceTarget?: string,
  resourceId?: string
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
  resourceTarget?: typeof ResourceTargets.Streams
  resourceId?: string
  role?: StreamRoles
  serverRole?: ServerRoles | null
}
