import type { MaybeNullOrUndefined, Nullable, Optional } from '@/modules/shared/helpers/typeHelper'
import type { ExtendedComment } from "@/modules/comments/repositories/comments";
import type { Dictionary } from 'lodash';
import { ResourceIdentifier } from '@/test/graphql/generated/graphql';
import { CommentRecord } from '@/modules/comments/helpers/types';
import { CommitRecord } from '@/modules/core/helpers/types';
import type { getBranchLatestCommits } from '@/modules/core/repositories/branches';

export interface CommentsRepository {
  getComment: (params: { id: string, userId?: string }) => Promise<Optional<ExtendedComment>>
  getCommentsResources: (commentIds: string[]) => Promise<Dictionary<{ commentId: string, resources: ResourceIdentifier[] }>>
  getPaginatedBranchComments: (params: PaginatedBranchCommentsParams) => Promise<{ items: CommentRecord[], cursor: string | null }>
  getPaginatedBranchCommentsTotalCount: (params: Omit<PaginatedBranchCommentsParams, 'limit' | 'cursor'>) => Promise<number>
  getPaginatedCommitComments: (params: PaginatedCommitCommentsParams) => Promise<{ items: CommentRecord[], cursor: string | null }>
  getPaginatedCommitCommentsTotalCount: (params: Omit<PaginatedCommitCommentsParams, 'limit' | 'cursor'>) => Promise<number>
  getPaginatedProjectComments: (params: PaginatedProjectCommentsParams, options?: PaginatedProjectCommentsOptions) => Promise<{ items: CommentRecord[], cursor: string | null }>
  getPaginatedProjectCommentsTotalCount: (params: Omit<PaginatedProjectCommentsParams, 'limit' | 'cursor'>, options?: PaginatedProjectCommentsOptions) => Promise<number>
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