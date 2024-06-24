import { MaybeNullOrUndefined, Nullable, Optional } from '@/modules/shared/helpers/typeHelper'
import { InsertCommentPayload } from "@/modules/comments/repositories/comments"
import { Dictionary } from 'lodash'
import { ResourceIdentifier } from '@/test/graphql/generated/graphql'
import { CommentLinkRecord, CommentRecord, CommentViewRecord } from '@/modules/comments/domain/types'
import { CommitRecord } from '@/modules/core/helpers/types'
import { getBranchLatestCommits } from '@/modules/core/repositories/branches'
import { Knex } from 'knex'
import { Merge } from 'type-fest'
import { SmartTextEditorValueSchema } from '@/modules/core/services/richTextEditorService'
import { ExtendedComment } from '@/modules/comments/domain/types'
import { BatchedSelectOptions } from '@/modules/shared/helpers/dbHelper'

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

type GetCommentParams = {
  id: string
  userId?: string
}

export type GetComment = (params: GetCommentParams) => Promise<ExtendedComment | undefined>

type GetCommentsParams = {
  // resources?: (ResourceIdentifier | null)[] | null
  // streamId?: string | null
  limit?: number
  cursor?: unknown
  userId?: string | null
  replies?: boolean
  archived?: boolean
} & (
    | {
      resources: (ResourceIdentifier | null)[]
      streamId: null
    }
    | {
      resources: null
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

type LegacyGetCommentParams = {
  id: string
}

export type LegacyGetComment = (params: LegacyGetCommentParams) => Promise<CommentRecord | undefined>



export type PaginatedProjectCommentsParams = {
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

export type PaginatedProjectCommentsOptions = Partial<{
  preloadedModelLatestVersions: PreloadedModelVersionRecord
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

export type PaginatedCommitCommentsParams = {
  commitId: string
  limit: number
  cursor?: MaybeNullOrUndefined<string>
  filter?: MaybeNullOrUndefined<{
    threadsOnly: boolean
    includeArchived: boolean
  }>
}

export type PreloadedModelVersionRecord = Awaited<ReturnType<typeof getBranchLatestCommits>>