import {
  ExtendedComment,
  ResourceIdentifier,
  ViewerResourceGroup,
  ViewerResourceItem
} from '@/modules/comments/domain/types'
import {
  CommentLinkRecord,
  CommentRecord,
  CommentViewRecord
} from '@/modules/comments/helpers/types'
import { BranchLatestCommit } from '@/modules/core/domain/commits/types'
import {
  CreateCommentInput,
  CreateCommentReplyInput,
  EditCommentInput,
  LegacyCommentViewerData,
  ViewerUpdateTrackingTarget
} from '@/modules/core/graph/generated/graphql'
import { SmartTextEditorValueSchema } from '@/modules/core/services/richTextEditorService'
import { BatchedSelectOptions } from '@/modules/shared/helpers/dbHelper'
import { MarkNullableOptional, Optional } from '@/modules/shared/helpers/typeHelper'
import { MaybeNullOrUndefined, SpeckleViewer } from '@speckle/shared'
import { Knex } from 'knex'
import { Merge } from 'type-fest'

type SerializedViewerState = SpeckleViewer.ViewerState.SerializedViewerState

type GetBatchedStreamCommentsOptions = BatchedSelectOptions & {
  /**
   * Filter out comments with parent comment references
   * Defaults to: false
   */
  withoutParentCommentOnly: boolean

  /**
   * Filter out comments without parent comment references
   * Defaults to: false
   */
  withParentCommentOnly: boolean
}

export type GetBatchedStreamComments = (
  streamId: string,
  options?: Partial<GetBatchedStreamCommentsOptions>
) => AsyncGenerator<CommentRecord[], void, unknown>

export type GetCommentLinks = (
  commentIds: string[],
  options?: Partial<{
    trx: Knex.Transaction
  }>
) => Promise<CommentLinkRecord[]>

export type GetComment = (params: {
  id: string
  userId?: string
}) => Promise<Optional<ExtendedComment>>

export type CheckStreamResourceAccess = (
  res: ResourceIdentifier,
  streamId: string
) => Promise<void>

export type InsertCommentPayload = MarkNullableOptional<
  Omit<CommentRecord, 'id' | 'createdAt' | 'updatedAt' | 'text' | 'archived'> & {
    text: SmartTextEditorValueSchema
    archived?: boolean
    id?: string
  }
>

export type InsertComments = (
  comments: InsertCommentPayload[],
  options?: Partial<{ trx: Knex.Transaction }>
) => Promise<CommentRecord[]>

export type InsertCommentLinks = (
  commentLinks: CommentLinkRecord[],
  options?: Partial<{ trx: Knex.Transaction }>
) => Promise<CommentLinkRecord[]>

export type DeleteComment = (params: { commentId: string }) => Promise<boolean>

export type MarkCommentViewed = (commentId: string, userId: string) => Promise<boolean>

export type UpdateComment = (
  id: string,
  input: Merge<Partial<CommentRecord>, { text?: SmartTextEditorValueSchema }>
) => Promise<Optional<CommentRecord>>

export type MarkCommentUpdated = (commentId: string) => Promise<void>

export type GetCommentsResources = (commentIds: string[]) => Promise<{
  [commentId: string]: {
    commentId: string
    resources: ResourceIdentifier[]
  }
}>

export type GetPaginatedCommitCommentsPage = (
  params: PaginatedCommitCommentsParams
) => Promise<{
  items: CommentRecord[]
  cursor: string | null
}>

export type GetPaginatedCommitCommentsTotalCount = (
  params: Omit<PaginatedCommitCommentsParams, 'limit' | 'cursor'>
) => Promise<number>

export type GetPaginatedBranchCommentsPage = (
  params: PaginatedBranchCommentsParams
) => Promise<{
  items: CommentRecord[]
  cursor: string | null
}>

export type GetPaginatedBranchCommentsTotalCount = (
  params: Omit<PaginatedBranchCommentsParams, 'limit' | 'cursor'>
) => Promise<number>

export type GetPaginatedProjectCommentsPage = (
  params: PaginatedProjectCommentsParams,
  options?: {
    preloadedModelLatestVersions?: BranchLatestCommit[]
  }
) => Promise<{
  items: CommentRecord[]
  cursor: string | null
}>

export type GetPaginatedProjectCommentsTotalCount = (
  params: Omit<PaginatedProjectCommentsParams, 'limit' | 'cursor'>,
  options?: {
    preloadedModelLatestVersions?: BranchLatestCommit[]
  }
) => Promise<number>

export type GetUserCommentsViewedAt = (
  commentIds: string[],
  userId: string
) => Promise<CommentViewRecord[]>

export type GetCommitCommentCounts = (
  commitIds: string[],
  options?: Partial<{
    threadsOnly: boolean
    includeArchived: boolean
  }>
) => Promise<
  {
    commitId: string
    count: number
  }[]
>

export type GetBranchCommentCounts = (
  branchIds: string[],
  options?: Partial<{
    threadsOnly: boolean
    includeArchived: boolean
  }>
) => Promise<
  {
    count: number
    id: string
  }[]
>

export type GetCommentReplyCounts = (
  threadIds: string[],
  options?: Partial<{
    includeArchived: boolean
  }>
) => Promise<
  {
    threadId: string
    count: number
  }[]
>

export type GetCommentReplyAuthorIds = (
  threadIds: string[],
  options?: Partial<{
    includeArchived: boolean
  }>
) => Promise<{ [parentCommentId: string]: string[] }>

export type GetCommentParents = (replyIds: string[]) => Promise<
  (CommentRecord & {
    replyId: string
  })[]
>

export type ResolvePaginatedProjectCommentsLatestModelResources = (
  resourceIdString: string | null | undefined
) => Promise<BranchLatestCommit[]>

export type CheckStreamResourcesAccess = (params: {
  streamId: string
  resources: ResourceIdentifier[]
}) => Promise<void>

export type ValidateInputAttachments = (
  streamId: string,
  blobIds: string[]
) => Promise<void>

export type GetViewerResourcesForComments = (
  projectId: string,
  commentIds: string[]
) => Promise<ViewerResourceItem[]>

export type GetViewerResourcesForComment = (
  projectId: string,
  commentId: string
) => Promise<ViewerResourceItem[]>

export type GetViewerResourcesFromLegacyIdentifiers = (
  projectId: string,
  resources: Array<ResourceIdentifier>
) => Promise<ViewerResourceItem[]>

export type GetViewerResourceGroups = (
  target: ViewerUpdateTrackingTarget
) => Promise<ViewerResourceGroup[]>

export type GetViewerResourceItemsUngrouped = (
  target: ViewerUpdateTrackingTarget
) => Promise<ViewerResourceItem[]>

export type ConvertLegacyDataToState = (
  data: Partial<LegacyCommentViewerData>,
  comment: CommentRecord
) => Promise<SerializedViewerState>

export type CreateCommentThreadAndNotify = (
  input: CreateCommentInput,
  userId: string
) => Promise<CommentRecord>

export type CreateCommentReplyAndNotify = (
  input: CreateCommentReplyInput,
  userId: string
) => Promise<CommentRecord>

export type EditCommentAndNotify = (
  input: EditCommentInput,
  userId: string
) => Promise<Optional<CommentRecord>>

export type ArchiveCommentAndNotify = (
  commentId: string,
  userId: string,
  archived?: boolean
) => Promise<Optional<CommentRecord>>

export type PaginatedCommitCommentsParams = {
  commitId: string
  limit: number
  cursor?: MaybeNullOrUndefined<string>
  filter?: MaybeNullOrUndefined<{
    threadsOnly: boolean
    includeArchived: boolean
  }>
}

export type GetPaginatedCommitComments = (
  params: PaginatedCommitCommentsParams
) => Promise<{
  totalCount: number
  items: CommentRecord[]
  cursor: string | null
}>

export type PaginatedBranchCommentsParams = {
  branchId: string
  limit: number
  cursor?: MaybeNullOrUndefined<string>
  filter?: MaybeNullOrUndefined<{
    threadsOnly: boolean
    includeArchived: boolean
  }>
}

export type GetPaginatedBranchCommentsFactory = (
  params: PaginatedBranchCommentsParams
) => Promise<{
  totalCount: number
  items: CommentRecord[]
  cursor: string | null
}>

export type PaginatedProjectCommentsParams = {
  projectId: string
  limit?: MaybeNullOrUndefined<number>
  cursor?: MaybeNullOrUndefined<string>
  filter?: MaybeNullOrUndefined<
    Partial<{
      threadsOnly: boolean | null
      includeArchived: boolean | null
      archivedOnly: boolean | null
      resourceIdString: string | null
      /**
       * If true, will ignore the version parts of `model@version` identifiers and look for comments of
       * all versions of any selected comments
       */
      allModelVersions: boolean | null
    }>
  >
}

export type GetPaginatedProjectComments = (
  params: PaginatedProjectCommentsParams
) => Promise<{
  totalCount: number
  totalArchivedCount: number
  items: CommentRecord[]
  cursor: string | null
}>
