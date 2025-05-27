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
import { ServerInviteRecord } from '@/modules/serverinvites/domain/types'
import type { Logger } from 'pino'
import { ProjectRecordVisibility } from '@/modules/core/helpers/types'

export type LegacyGetStreams = (params: {
  cursor?: string | Date | null | undefined
  limit: number
  orderBy?: string | null | undefined
  visibility?: ProjectRecordVisibility | 'all' | null | undefined
  searchQuery?: string | null | undefined
  streamIdWhitelist?: string[] | null | undefined
  workspaceIdWhitelist?: string[] | null | undefined
  offset?: MaybeNullOrUndefined<number>
  publicOnly?: MaybeNullOrUndefined<boolean>
  /**
   * For filling in stream.role for the specified user
   */
  userId?: string
}) => Promise<{
  streams: StreamWithOptionalRole[]
  totalCount: number
  cursorDate: Nullable<Date>
}>

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
  type?: StreamRoles,
  options?: Partial<{
    limit: number
  }>
) => Promise<Array<LimitedUserWithStreamRole>>

export type GetStreamsCollaborators = (params: { streamIds: string[] }) => Promise<{
  [streamId: string]: Array<LimitedUserWithStreamRole>
}>

export type GetStreamsCollaboratorCounts = (params: {
  streamIds: string[]
  type?: StreamRoles
}) => Promise<{
  [streamId: string]:
    | {
        [role in StreamRoles]?: number
      }
    | undefined
}>

export type GetUserDeletableStreams = (userId: string) => Promise<Array<string>>

export type GetImplicitUserProjectsCountFactory = (params: {
  userId: string
}) => Promise<number>

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
  /**
   * Only allow streams in the specified workspace to be returned
   */
  workspaceId?: MaybeNullOrUndefined<string>

  /**
   * Only allow personal (non-workspace) streams to be returned
   */
  personalOnly?: MaybeNullOrUndefined<boolean>

  /**
   * If set to true, will also include streams that the user may not have an explicit role on,
   * but has implicit access to because of workspaces
   */
  includeImplicitAccess?: MaybeNullOrUndefined<boolean>

  /**
   * Only with active sso session
   */
  onlyWithActiveSsoSession?: boolean
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
  /**
   * Fields used to sort the result (supports any UserRecord field plus role field of the StreamAcl)
   */
  sortBy?: MaybeNullOrUndefined<string[]>
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

export type RevokeStreamPermissions = (
  params: {
    streamId: string
    userId: string
  },
  options?: Partial<{
    /**
     * Whether to mark project record as updated
     */
    trackProjectUpdate: boolean
  }>
) => Promise<Optional<Stream>>

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

export type DeleteStream = (streamId: string, deleterId: string) => Promise<boolean>

export type UpdateStream = (
  update: StreamUpdateInput | ProjectUpdateInput,
  updaterId: string
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
  expectedRole?: string,
  userResourceAccessLimits?: MaybeNullOrUndefined<TokenResourceIdentifier[]>
) => Promise<boolean>

export type AddOrUpdateStreamCollaborator = (
  streamId: string,
  userId: string,
  role: string,
  addedById: string,
  adderResourceAccessRules?: MaybeNullOrUndefined<TokenResourceIdentifier[]>,
  options?: Partial<{
    fromInvite: ServerInviteRecord
    /**
     * Whether to mark project record as updated
     */
    trackProjectUpdate: boolean
    /**
     * Whether to skipp checking if setByUserId has access to the stream
     */
    skipAuthorization: boolean
  }>
) => Promise<Stream>

export type RemoveStreamCollaborator = (
  streamId: string,
  userId: string,
  removedById: string,
  removerResourceAccessRules?: MaybeNullOrUndefined<TokenResourceIdentifier[]>,
  options?: Partial<{
    /**
     * Whether to mark project record as updated
     */
    trackProjectUpdate: boolean
    /**
     * Whether to skipp checking if setByUserId has access to the stream
     */
    skipAuthorization: boolean
  }>
) => Promise<Stream>

export type SetStreamCollaborator = (
  params: {
    streamId: string
    userId: string
    /**
     * Null/undefined means - remove collaborator
     */
    role: MaybeNullOrUndefined<StreamRoles>
    setByUserId: string
    setterResourceAccessRules?: MaybeNullOrUndefined<TokenResourceIdentifier[]>
  },
  options?: Partial<{
    /**
     * Whether to mark project record as updated
     */
    trackProjectUpdate: boolean
    /**
     * Whether to skipp checking if setByUserId has access to the stream
     */
    skipAuthorization: boolean
  }>
) => Promise<Stream>

export type CloneStream = (userId: string, sourceStreamId: string) => Promise<Stream>

export type CreateOnboardingStream = (params: {
  targetUserId: string
  targetUserResourceAccessRules: ContextResourceAccessRules
  logger: Logger
}) => Promise<Stream>

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
