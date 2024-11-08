import {
  StreamWithCommitId,
  StreamWithOptionalRole,
  LimitedUserWithStreamRole,
  Stream,
  StreamFavoriteMetadata
} from '@/modules/core/domain/streams/types'
import { TokenResourceIdentifier } from '@/modules/core/domain/tokens/types'
import {
  DiscoverableStreamsSortingInput,
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
import type express from 'express'
import { ProjectCreateArgs } from '@/modules/core/domain/projects/operations'

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

export type GetUserDeletableStreams = (userId: string) => Promise<Array<string>>

export type LegacyGetStreamCollaborators = (params: { streamId: string }) => Promise<
  {
    role: string
    id: string
    name: string
    company: string
    avatar: string
  }[]
>

export type StoreStream = (
  input: StreamCreateInput | ProjectCreateArgs,
  options?: Partial<{
    ownerId: string
    trx: Knex.Transaction
  }>
) => Promise<Stream>

export type SetStreamFavorited = (params: {
  streamId: string
  userId: string
  favorited?: boolean
}) => Promise<void>

export type CanUserFavoriteStream = (params: {
  userId: string
  streamId: string
}) => Promise<boolean>

export type DeleteStreamRecord = (streamId: string) => Promise<number>

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

export type BaseUserStreamsQueryParams = {
  /**
   * User whose streams we wish to find
   */
  userId: string
  /**
   * Filter streams by name/description/id
   */
  searchQuery?: string
  /**
   * Whether this data is retrieved for another user, and thus the data set
   * should be limited to only show publicly accessible (discoverable) streams
   */
  forOtherUser?: boolean
  /**
   * Only return streams owned by userId
   */
  ownedOnly?: boolean

  /**
   * Only return streams where user has the specified roles
   */
  withRoles?: StreamRoles[]

  /**
   * Only allow streams with the specified IDs to be returned
   */
  streamIdWhitelist?: string[]
  workspaceId?: string
}

export type UserStreamsQueryParams = BaseUserStreamsQueryParams & {
  /**
   * Max amount of streams per page. Defaults to 25, max is 50.
   */
  limit?: MaybeNullOrUndefined<number>
  /**
   * Pagination cursor
   */
  cursor?: MaybeNullOrUndefined<string>
}

export type UserStreamsQueryCountParams = BaseUserStreamsQueryParams

export type GetUserStreamsPage = (params: UserStreamsQueryParams) => Promise<{
  streams: StreamWithOptionalRole[]
  cursor: string | null
}>

export type GetUserStreamsCount = (
  params: UserStreamsQueryCountParams
) => Promise<number>

export type MarkBranchStreamUpdated = (branchId: string) => Promise<boolean>

export type MarkCommitStreamUpdated = (commitId: string) => Promise<boolean>

export type MarkOnboardingBaseStream = (
  streamId: string,
  version: string
) => Promise<void>

export type GetBatchUserFavoriteData = (params: {
  userId: string
  streamIds: string[]
}) => Promise<{ [streamId: string]: StreamFavoriteMetadata }>

export type GetBatchStreamFavoritesCounts = (streamIds: string[]) => Promise<{
  [streamId: string]: number
}>

export type GetOwnedFavoritesCountByUserIds = (userIds: string[]) => Promise<{
  [userId: string]: number
}>

export type GetStreamRoles = (
  userId: string,
  streamIds: string[]
) => Promise<{
  [streamId: string]: Nullable<string>
}>

export type GetUserStreamCounts = (params: {
  userIds: string[]
  publicOnly?: boolean
}) => Promise<{
  [userId: string]: number
}>

export type GetStreamsSourceApps = (streamIds: string[]) => Promise<{
  [streamId: string]: string[]
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
  params: (StreamCreateInput | ProjectCreateArgs) & {
    ownerId: string
    ownerResourceAccessRules?: MaybeNullOrUndefined<TokenResourceIdentifier[]>
  }
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

export type FavoriteStream = (params: {
  userId: string
  streamId: string
  favorited?: boolean | undefined
  userResourceAccessRules?: ContextResourceAccessRules
}) => Promise<Stream>

export type AdminGetProjectList = (args: {
  query: string | null
  orderBy: string | null
  visibility: string | null
  limit: number
  streamIdWhitelist?: string[]
  cursor: string | null
}) => Promise<{
  cursor: null | string
  items: Stream[]
  totalCount: number
}>

export type ValidatePermissionsReadStream = (
  streamId: string,
  req: express.Request
) => Promise<{
  result: boolean
  status: number
}>

export type ValidatePermissionsWriteStream = (
  streamId: string,
  req: express.Request
) => Promise<{
  result: boolean
  status: number
}>
