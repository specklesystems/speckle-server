import {
  StreamWithCommitId,
  StreamWithOptionalRole,
  LimitedUserWithStreamRole,
  Stream
} from '@/modules/core/domain/streams/types'
import { TokenResourceIdentifier } from '@/modules/core/domain/tokens/types'
import {
  DiscoverableStreamsSortingInput,
  ProjectCreateInput,
  ProjectUpdateInput,
  ProjectUpdateRoleInput,
  QueryDiscoverableStreamsArgs,
  StreamCreateInput,
  StreamRevokePermissionInput,
  StreamUpdateInput,
  StreamUpdatePermissionInput
} from '@/modules/core/graph/generated/graphql'
import { ContextResourceAccessRules } from '@/modules/core/helpers/token'
import { MaybeNullOrUndefined, Nullable, Optional, StreamRoles } from '@speckle/shared'
import { Knex } from 'knex'

export type LegacyGetStreams = (params: {
  cursor?: string | Date | null | undefined
  limit: number
  orderBy?: string | null | undefined
  visibility?: string | null | undefined
  searchQuery?: string | null | undefined
  streamIdWhitelist?: string[] | null | undefined
  workspaceIdWhitelist?: string[] | null | undefined
  offset?: MaybeNullOrUndefined<number>
  publicOnly?: MaybeNullOrUndefined<boolean>
}) => Promise<{ streams: Stream[]; totalCount: number; cursorDate: Nullable<Date> }>

export type GetStreams = (
  streamIds: string[],
  options?: Partial<{
    userId: string
    trx: Knex.Transaction
  }>
) => Promise<StreamWithOptionalRole[]>

export type GetStream = (
  params: {
    streamId?: string
    userId?: string
  },
  options?: Partial<{
    trx: Knex.Transaction
  }>
) => Promise<Optional<StreamWithOptionalRole>>

export type GetCommitStreams = (params: {
  commitIds: string[]
  userId?: string
}) => Promise<StreamWithCommitId[]>

export type GetCommitStream = (params: {
  commitId: string
  userId?: string
}) => Promise<Optional<StreamWithCommitId>>

export type GetStreamCollaborators = (
  streamId: string,
  type?: StreamRoles
) => Promise<Array<LimitedUserWithStreamRole>>

export type StoreStream = (
  input: StreamCreateInput | ProjectCreateInput,
  options?: Partial<{
    ownerId: string
    trx: Knex.Transaction
  }>
) => Promise<Stream>

export type DeleteStreamRecords = (streamId: string) => Promise<number>

export type GetOnboardingBaseStream = (version: string) => Promise<Optional<Stream>>

export type UpdateStreamRecord = (
  update: StreamUpdateInput | ProjectUpdateInput
) => Promise<Nullable<Stream>>

export type GetDiscoverableStreamsParams = Required<QueryDiscoverableStreamsArgs> & {
  sort: DiscoverableStreamsSortingInput
  /**
   * Only allow streams with the specified IDs to be returned
   */
  streamIdWhitelist?: string[]
}

export type CountDiscoverableStreams = (
  params: GetDiscoverableStreamsParams
) => Promise<number>

export type GetDiscoverableStreamsPage = (
  params: GetDiscoverableStreamsParams
) => Promise<Stream[]>

export type GetFavoritedStreamsPage = (params: {
  userId: string
  cursor?: string | null
  limit?: number
  streamIdWhitelist?: Optional<string[]>
}) => Promise<{
  streams: Stream[]
  cursor: Nullable<string>
}>

export type GetFavoritedStreamsCount = (
  userId: string,
  streamIdWhitelist?: Optional<string[]>
) => Promise<number>

export type RevokeStreamPermissions = (params: {
  streamId: string
  userId: string
}) => Promise<Optional<Stream>>

export type GrantStreamPermissions = (
  params: {
    streamId: string
    userId: string
    role: StreamRoles
  },
  options?: {
    trackProjectUpdate?: boolean
  }
) => Promise<Optional<Stream>>

export type CreateStream = (
  params: (StreamCreateInput | ProjectCreateInput) & {
    ownerId: string
    ownerResourceAccessRules?: MaybeNullOrUndefined<TokenResourceIdentifier[]>
  },
  options?: Partial<{
    createActivity: boolean
  }>
) => Promise<Stream>

export type LegacyCreateStream = (
  params: StreamCreateInput & { ownerId: string }
) => Promise<string>

export type DeleteStream = (
  streamId: string,
  deleterId: string,
  deleterResourceAccessRules: ContextResourceAccessRules,
  options?: {
    skipAccessChecks?: boolean
  }
) => Promise<boolean>

export type UpdateStream = (
  update: StreamUpdateInput | ProjectUpdateInput,
  updaterId: string,
  updaterResourceAccessRules: ContextResourceAccessRules
) => Promise<Stream>

export type LegacyUpdateStream = (
  update: StreamUpdateInput
) => Promise<Nullable<string>>

export type PermissionUpdateInput =
  | StreamUpdatePermissionInput
  | StreamRevokePermissionInput
  | ProjectUpdateRoleInput

export type UpdateStreamRole = (
  update: PermissionUpdateInput,
  updaterId: string,
  updaterResourceAccessRules: MaybeNullOrUndefined<TokenResourceIdentifier[]>
) => Promise<Stream | undefined>

export type IsStreamCollaborator = (
  userId: string,
  streamId: string
) => Promise<boolean>

export type ValidateStreamAccess = (
  userId: MaybeNullOrUndefined<string>,
  streamId: string,
  expectedRole?: string | undefined,
  userResourceAccessLimits?: MaybeNullOrUndefined<TokenResourceIdentifier[]>
) => Promise<boolean>

export type AddOrUpdateStreamCollaborator = (
  streamId: string,
  userId: string,
  role: string,
  addedById: string,
  adderResourceAccessRules?: MaybeNullOrUndefined<TokenResourceIdentifier[]>,
  options?: Partial<{
    fromInvite: boolean
  }>
) => Promise<Stream>

export type RemoveStreamCollaborator = (
  streamId: string,
  userId: string,
  removedById: string,
  removerResourceAccessRules?: MaybeNullOrUndefined<TokenResourceIdentifier[]>
) => Promise<Stream>

export type CloneStream = (userId: string, sourceStreamId: string) => Promise<Stream>

export type CreateOnboardingStream = (
  targetUserId: string,
  targetUserResourceAccessRules: ContextResourceAccessRules
) => Promise<Stream>

export type GetDiscoverableStreams = (
  args: QueryDiscoverableStreamsArgs,
  streamIdWhitelist?: Optional<string[]>
) => Promise<{
  cursor: Nullable<string>
  totalCount: number
  items: Stream[]
}>

export type GetFavoriteStreamsCollection = (params: {
  userId: string
  limit?: number | undefined
  cursor?: string | null | undefined
  streamIdWhitelist?: string[] | undefined
}) => Promise<{ totalCount: number; cursor: Nullable<string>; items: Stream[] }>
