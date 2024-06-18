import type { MaybeNullOrUndefined, Nullable, Optional } from '@/modules/shared/helpers/typeHelper'
import type { ExtendedComment, InsertCommentPayload } from "@/modules/comments/repositories/comments";
import type { Dictionary } from 'lodash';
import type { ResourceIdentifier } from '@/test/graphql/generated/graphql';
import type { CommentLinkRecord, CommentRecord } from '@/modules/comments/helpers/types';
import type { CommitRecord } from '@/modules/core/helpers/types';
import type { getBranchLatestCommits } from '@/modules/core/repositories/branches';
import type { Knex } from 'knex'

export interface CommentsRepository {
  getComment: (params: { id: string, userId?: string }) => Promise<Optional<ExtendedComment>>
  getCommentsResources: (commentIds: string[]) => Promise<Dictionary<{ commentId: string, resources: ResourceIdentifier[] }>>
  getPaginatedBranchComments: (params: PaginatedBranchCommentsParams) => Promise<{ items: CommentRecord[], cursor: string | null }>
  getPaginatedBranchCommentsTotalCount: (params: Omit<PaginatedBranchCommentsParams, 'limit' | 'cursor'>) => Promise<number>
  getPaginatedCommitComments: (params: PaginatedCommitCommentsParams) => Promise<{ items: CommentRecord[], cursor: string | null }>
  getPaginatedCommitCommentsTotalCount: (params: Omit<PaginatedCommitCommentsParams, 'limit' | 'cursor'>) => Promise<number>
  getPaginatedProjectComments: (params: PaginatedProjectCommentsParams, options?: PaginatedProjectCommentsOptions) => Promise<{ items: CommentRecord[], cursor: string | null }>
  getPaginatedProjectCommentsTotalCount: (params: Omit<PaginatedProjectCommentsParams, 'limit' | 'cursor'>, options?: PaginatedProjectCommentsOptions) => Promise<number>
  getResourceCommentCount: ({ resourceId }: { resourceId: string }) => Promise<number>
  insertComment: (input: InsertCommentPayload, options?: Partial<{ trx: Knex.Transaction }>) => Promise<CommentRecord>
  insertCommentLinks: (commentLinks: CommentLinkRecord[], options?: Partial<{ trx: Knex.Transaction }>) => Promise<number[]>
  markCommentViewed: (commentId: string, userId: string) => Promise<number[]>
  resolvePaginatedProjectCommentsLatestModelResources: (resourceIdString: string | null | undefined) => Promise<(CommitRecord & { branchId: string })[]>
}

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