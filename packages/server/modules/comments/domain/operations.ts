import { MarkNullableOptional, MaybeNullOrUndefined, Nullable } from '@/modules/shared/helpers/typeHelper'
import { Dictionary } from 'lodash'
import { ResourceIdentifier } from '@/test/graphql/generated/graphql'
import { CommentLinkRecord, CommentRecord, CommentViewRecord } from '@/modules/comments/domain/types'
import { getBranchLatestCommits } from '@/modules/core/repositories/branches'
import { Knex } from 'knex'
import { Merge } from 'type-fest'
import { SmartTextEditorValueSchema } from '@/modules/core/services/richTextEditorService'
import { ExtendedComment } from '@/modules/comments/domain/types'
import { BatchedSelectOptions } from '@/modules/shared/helpers/dbHelper'
import { CommitRecord } from '@/modules/core/helpers/types'

type DeleteCommentParams = {
  commentId: string
}

export type DeleteComment = (params: DeleteCommentParams) => Promise<void>

type GetBatchedStreamCommentsParams = {
  streamId: string
  options?: Partial<GetBatchedStreamCommentsOptions>
}

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

export type GetBatchedStreamComments = (params: GetBatchedStreamCommentsParams) => AsyncGenerator<CommentRecord[], void, never>

type GetBranchCommentCountsParams = {
  branchIds: string[]
  options: GetBranchCommentCountsOptions
}

type GetBranchCommentCountsOptions = {
  includeArchived?: boolean
  threadsOnly?: boolean
}

type GetBranchCommentCountsReturnValue = {
  id: string
  count: number
}[]

export type GetBranchCommentCounts = (params: GetBranchCommentCountsParams) => Promise<GetBranchCommentCountsReturnValue>

type GetCommentParams = {
  id: string
  userId?: string
}

export type GetComment = (params: GetCommentParams) => Promise<ExtendedComment | undefined>

type GetCommentsParams = {
  limit?: number
  cursor?: unknown
  userId?: string | null
  replies?: boolean
  archived?: boolean
} & (
    | {
      resources: (ResourceIdentifier | null)[]
      streamId?: null
    }
    | {
      resources?: (ResourceIdentifier | null)[] | null
      streamId: string
    }
  )

type GetCommentsReturnValue = {
  items: CommentRecord[]
  /** ISO string of `createdAt` of last found row, if present. */
  cursor: string | null
  totalCount: number
}

export type GetComments = (params: GetCommentsParams) => Promise<GetCommentsReturnValue>

type GetCommentLinksParams = {
  commentIds: string[]
  options?: GetCommentLinksOptions
}

type GetCommentLinksOptions = {
  trx?: Knex.Transaction
}

export type GetCommentLinks = (params: GetCommentLinksParams) => Promise<CommentLinkRecord[]>

type GetCommentParentsParams = {
  replyIds: string[]
}

type GetCommentParentsReturnValue = (CommentRecord & {
  replyId: string
})[]

export type GetCommentParents = (params: GetCommentParentsParams) => Promise<GetCommentParentsReturnValue>

type GetCommentReplyAuthorIdsParams = {
  threadIds: string[]
  options?: GetCommentReplyAuthorIdsOptions
}

type GetCommentReplyAuthorIdsOptions = {
  includeArchived?: boolean
}

/** Author user ids keyed by thread id */
type GetCommentReplyAuthorIdsReturnValue = Record<string, string[]>

export type GetCommentReplyAuthorIds = (params: GetCommentReplyAuthorIdsParams) => Promise<GetCommentReplyAuthorIdsReturnValue>

type GetCommentReplyCountsParams = {
  threadIds: string[]
  options?: GetCommentReplyCountsOptions
}

type GetCommentReplyCountsOptions = {
  includeArchived?: boolean
}

type GetCommentReplyCountsReturnValue = {
  threadId: string
  count: number
}[]

export type GetCommentReplyCounts = (params: GetCommentReplyCountsParams) => Promise<GetCommentReplyCountsReturnValue>

type GetCommentsResourcesParams = {
  commentIds: string[]
}

/** Keyed by `commentId` */
type GetCommentsResourcesReturnValue = Dictionary<{
  commentId: string
  resources: ResourceIdentifier[]
}>

export type GetCommentsResources = (params: GetCommentsResourcesParams) => Promise<GetCommentsResourcesReturnValue>

type GetCommentsViewedAtParams = {
  commentIds: string[]
  userId: string
}

export type GetCommentsViewedAt = (params: GetCommentsViewedAtParams) => Promise<CommentViewRecord[]>

type GetCommitCommentCountsParams = {
  commitIds: string[]
  options: GetCommitCommentCountsOptions
}

type GetCommitCommentCountsOptions = {
  threadsOnly?: boolean
  includeArchived?: boolean
}

type GetCommitCommentCountsReturnValue = {
  commitId: string
  count: number
}[]

export type GetCommitCommentCounts = (params: GetCommitCommentCountsParams) => Promise<GetCommitCommentCountsReturnValue>

type GetStreamCommentCountParams = {
  streamId: string
  options?: GetStreamCommentCountOptions
}

type GetStreamCommentCountOptions = {
  includeArchived?: boolean
  threadsOnly?: boolean
}

export type GetStreamCommentCount = (params: GetStreamCommentCountParams) => Promise<number>

type GetStreamCommentCountsParams = {
  streamIds: string[]
  options?: GetStreamCommentCountsOptions
}

type GetStreamCommentCountsOptions = {
  includeArchived?: boolean
  threadsOnly?: boolean
}

type GetStreamCommentCountsReturnValue = {
  streamId: string
  count: number
}[]

export type GetStreamCommentCounts = (params: GetStreamCommentCountsParams) => Promise<GetStreamCommentCountsReturnValue>

type GetPaginatedBranchCommentsParams = {
  branchId: string
  limit: number
  cursor?: MaybeNullOrUndefined<string>
  filter?: MaybeNullOrUndefined<{
    threadsOnly: boolean
    includeArchived: boolean
  }>
}

type GetPaginatedBranchCommentsReturnValue = {
  items: CommentRecord[]
  /** ISO string of `createdAt` value, if present */
  cursor: string | null
}

export type GetPaginatedBranchComments = (params: GetPaginatedBranchCommentsParams) => Promise<GetPaginatedBranchCommentsReturnValue>

type GetPaginatedBranchCommentsTotalCountParams = {
  branchId: string
  filter?: MaybeNullOrUndefined<{
    threadsOnly: boolean
    includeArchived: boolean
  }>
}

export type GetPaginatedBranchCommentsTotalCount = (params: GetPaginatedBranchCommentsTotalCountParams) => Promise<number>

type GetPaginatedCommitCommentsParams = {
  commitId: string
  limit: number
  cursor?: MaybeNullOrUndefined<string>
  filter?: MaybeNullOrUndefined<{
    threadsOnly: boolean
    includeArchived: boolean
  }>
}

type GetPaginatedCommitCommentsReturnValue = {
  items: CommentRecord[],
  /** ISO string of `createdAt` value, if present */
  cursor: string | null
}

export type GetPaginatedCommitComments = (params: GetPaginatedCommitCommentsParams) => Promise<GetPaginatedCommitCommentsReturnValue>

type GetPaginatedCommitCommentsTotalCountParams = {
  commitId: string
  filter?: MaybeNullOrUndefined<{
    threadsOnly: boolean
    includeArchived: boolean
  }>
}

export type GetPaginatedCommitCommentsTotalCount = (params: GetPaginatedCommitCommentsTotalCountParams) => Promise<number>

type GetPaginatedProjectCommentsParams = {
  projectId: string
  limit: number
  cursor?: MaybeNullOrUndefined<string>
  filter?: MaybeNullOrUndefined<Partial<{
    threadsOnly: Nullable<boolean>
    includeArchived: Nullable<boolean>
    archivedOnly: Nullable<boolean>
    resourceIdString: Nullable<string>
    /**
     * If true, will ignore the version parts of `model@version` identifiers and look for comments of
     * all versions of any selected comments
     */
    allModelVersions: Nullable<boolean>
  }>>
}

type GetPaginatedProjectCommentsOptions = Partial<{
  preloadedModelLatestVersions: Awaited<ReturnType<typeof getBranchLatestCommits>>
}>

type GetPaginatedProjectCommentsReturnValue = {
  items: CommentRecord[]
  /** ISO string of `createdAt` value, if present */
  cursor: string | null
}

export type GetPaginatedProjectComments = (params: GetPaginatedProjectCommentsParams, options?: GetPaginatedProjectCommentsOptions) => Promise<GetPaginatedProjectCommentsReturnValue>

type GetPaginatedProjectCommentsTotalCountParams = {
  projectId: string
  filter?: MaybeNullOrUndefined<Partial<{
    threadsOnly: Nullable<boolean>
    includeArchived: Nullable<boolean>
    archivedOnly: Nullable<boolean>
    resourceIdString: Nullable<string>
    /**
     * If true, will ignore the version parts of `model@version` identifiers and look for comments of
     * all versions of any selected comments
     */
    allModelVersions: Nullable<boolean>
  }>>
}

type GetPaginatedProjectCommentsTotalCountOptions = Partial<{
  preloadedModelLatestVersions: Awaited<ReturnType<typeof getBranchLatestCommits>>
}>

export type GetPaginatedProjectCommentsTotalCount = (params: GetPaginatedProjectCommentsTotalCountParams, options?: GetPaginatedProjectCommentsTotalCountOptions) => Promise<number>

type GetResourceCommentCountParams = {
  resourceId: string
}

export type GetResourceCommentCount = (params: GetResourceCommentCountParams) => Promise<number>

type InsertCommentParams = MarkNullableOptional<Omit<
  CommentRecord, 'id' | 'createdAt' | 'updatedAt' | 'text' | 'archived'> & {
    text: SmartTextEditorValueSchema
    archived?: boolean
  }>

type InsertCommentOptions = {
  trx?: Knex.Transaction
}

export type InsertComment = (params: InsertCommentParams, options?: InsertCommentOptions) => Promise<CommentRecord>

type InsertCommentLinksParams = {
  commentLinks: CommentLinkRecord[]
  options?: InsertCommentLinksOptions
}

type InsertCommentLinksOptions = {
  trx?: Knex.Transaction
}

export type InsertCommentLinks = (params: InsertCommentLinksParams) => Promise<number[]>

type InsertCommentsParams = {
  comments: CommentRecord[]
  options?: InsertCommentsOptions
}

type InsertCommentsOptions = {
  trx?: Knex.Transaction
}

export type InsertComments = (params: InsertCommentsParams) => Promise<number[]>

type LegacyGetCommentParams = {
  id: string
}

export type LegacyGetComment = (params: LegacyGetCommentParams) => Promise<CommentRecord | undefined>

type MarkCommentUpdatedParams = {
  commentId: string
}

export type MarkCommentUpdated = (params: MarkCommentUpdatedParams) => Promise<number>

type MarkCommentViewedParams = {
  commentId: string
  userId: string
}

export type MarkCommentViewed = (params: MarkCommentViewedParams) => Promise<number[]>

export type ResolvePaginatedProjectCommentsLatestModelResources = (resourceIdString?: string | null) => Promise<(CommitRecord & { branchId: string })[]>

type UpdateCommentParams = {
  id: string
  input: Merge<Partial<CommentRecord>, { text?: SmartTextEditorValueSchema }>
}

export type UpdateComment = (params: UpdateCommentParams) => Promise<CommentRecord>
