import { Branch } from '@/modules/core/domain/branches/types'
import {
  CommitWithStreamBranchMetadata,
  Commit,
  CommitBranch,
  CommitWithStreamId,
  LegacyUserCommit,
  LegacyStreamCommit,
  CommitWithStreamBranchId
} from '@/modules/core/domain/commits/types'
import {
  CommitsDeleteInput,
  CommitsMoveInput,
  CommitUpdateInput,
  DeleteVersionsInput,
  ModelVersionsFilter,
  MoveVersionsInput,
  StreamCommitsArgs,
  UpdateVersionInput
} from '@/modules/core/graph/generated/graphql'
import { BranchCommitRecord, StreamCommitRecord } from '@/modules/core/helpers/types'
import { BatchedSelectOptions } from '@/modules/shared/helpers/dbHelper'
import {
  MaybeNullOrUndefined,
  Nullable,
  NullableKeysToOptional,
  Optional
} from '@speckle/shared'
import { Knex } from 'knex'

export type GetCommits = (
  commitIds: string[],
  options?: Partial<{
    streamId: string
  }>
) => Promise<CommitWithStreamBranchMetadata[]>

export type GetCommit = (
  commitId: string,
  options?: Partial<{ streamId: string }>
) => Promise<Optional<CommitWithStreamBranchMetadata>>

export type DeleteCommits = (commitIds: string[]) => Promise<number>
export type DeleteCommit = (commitId: string) => Promise<boolean>

export type DeleteCommitAndNotify = (
  commitId: string,
  streamId: string,
  userId: string
) => Promise<boolean>

export type GetSpecificBranchCommits = (
  pairs: {
    branchId: string
    commitId: string
  }[]
) => Promise<CommitWithStreamBranchId[]>

export type StoreCommit = (
  params: Omit<NullableKeysToOptional<Commit>, 'id' | 'createdAt'>
) => Promise<Commit>

export type CreateCommitByBranchId = (
  params: NullableKeysToOptional<{
    streamId: string
    branchId: string
    objectId: string
    authorId: string
    message: Nullable<string>
    sourceApplication: Nullable<string>
    totalChildrenCount?: MaybeNullOrUndefined<number>
    parents: Nullable<string[]>
  }>,
  options?: Partial<{
    notify: boolean
  }>
) => Promise<CommitWithStreamBranchId>

export type CreateCommitByBranchName = (
  params: NullableKeysToOptional<{
    streamId: string
    branchName: string
    objectId: string
    authorId: string
    message: Nullable<string>
    sourceApplication: Nullable<string>
    totalChildrenCount?: MaybeNullOrUndefined<number>
    parents: Nullable<string[]>
  }>,
  options?: Partial<{
    notify: boolean
  }>
) => Promise<Commit>

export type InsertBranchCommits = (
  branchCommits: BranchCommitRecord[],
  options?: Partial<{
    trx: Knex.Transaction
  }>
) => Promise<number[]>

export type InsertStreamCommits = (
  streamCommits: StreamCommitRecord[],
  options?: Partial<{
    trx: Knex.Transaction
  }>
) => Promise<number[]>

export type UpdateCommitAndNotify = (
  params: CommitUpdateInput | UpdateVersionInput,
  userId: string
) => Promise<CommitWithStreamBranchId>

export type GetCommitBranches = (commitIds: string[]) => Promise<CommitBranch[]>

export type GetCommitBranch = (commitId: string) => Promise<Optional<CommitBranch>>

export type SwitchCommitBranch = (
  commitId: string,
  newBranchId: string,
  oldBranchId?: string
) => Promise<void>

export type UpdateCommit = (
  commitId: string,
  commit: Partial<Commit>
) => Promise<Commit>

export type GetAllBranchCommits = (params: {
  branchIds?: string[]
  projectId?: string
}) => Promise<{ [branchId: string]: Commit[] }>

export type GetStreamCommitCounts = (
  streamIds: string[],
  options?: Partial<{
    ignoreGlobalsBranch: boolean
  }>
) => Promise<
  {
    count: number
    streamId: string
  }[]
>

export type GetStreamCommitCount = (
  streamId: string,
  options?: Partial<{
    ignoreGlobalsBranch: boolean
  }>
) => Promise<number>

export type GetUserStreamCommitCounts = (params: {
  userIds: string[]
  publicOnly?: boolean
}) => Promise<{
  [userId: string]: number
}>

export type GetUserAuthoredCommitCounts = (params: {
  userIds: string[]
  publicOnly?: boolean
}) => Promise<{
  [userId: string]: number
}>

export type GetCommitsAndTheirBranchIds = (
  commitIds: string[]
) => Promise<CommitWithStreamBranchId[]>

export type GetBatchedStreamCommits = (
  streamId: string,
  options?: Partial<BatchedSelectOptions>
) => AsyncGenerator<Commit[], void, unknown>

export type GetBatchedBranchCommits = (
  branchIds: string[],
  options?: Partial<BatchedSelectOptions>
) => AsyncGenerator<(BranchCommitRecord & { streamId: string })[], void, unknown>

export type InsertCommits = (
  commits: Commit[],
  options?: Partial<{
    trx: Knex.Transaction
  }>
) => Promise<number[]>

export type PaginatedBranchCommitsBaseParams = {
  branchId: string
  filter?: Nullable<{
    /**
     * Exclude specific commits
     */
    excludeIds?: string[]
  }>
}

export type PaginatedBranchCommitsParams = PaginatedBranchCommitsBaseParams & {
  limit: number
  cursor?: Nullable<string>
}

export type GetPaginatedBranchCommitsItems = (
  params: PaginatedBranchCommitsParams
) => Promise<{
  commits: CommitWithStreamBranchId[]
  cursor: string | null
}>

export type GetBranchCommitsTotalCount = (
  params: PaginatedBranchCommitsBaseParams
) => Promise<number>

export type GetPaginatedBranchCommits = (
  params: PaginatedBranchCommitsParams & {
    filter?: Nullable<ModelVersionsFilter>
  }
) => Promise<{
  totalCount: number
  items: CommitWithStreamBranchId[]
  cursor: string | null
}>

export type GetBranchCommitsTotalCountByName = (params: {
  streamId: string
  branchName: string
}) => Promise<number>

export type GetPaginatedBranchCommitsItemsByName = (params: {
  streamId: string
  branchName: string
  limit: number
  cursor?: Nullable<string>
}) => Promise<{
  commits: Commit[]
  cursor: string | null
}>

export type MoveCommitsToBranch = (
  commitIds: string[],
  branchId: string
) => Promise<number | undefined>

export type ValidateAndBatchMoveCommits = (
  params: CommitsMoveInput | MoveVersionsInput,
  userId: string
) => Promise<Branch>

export type ValidateAndBatchDeleteCommits = (
  params: CommitsDeleteInput | DeleteVersionsInput,
  userId: string
) => Promise<void>

export type GetObjectCommitsWithStreamIds = (
  objectIds: string[],
  options?: {
    streamIds?: string[]
  }
) => Promise<CommitWithStreamId[]>

export type LegacyGetPaginatedUserCommitsPage = (params: {
  userId: string
  limit?: MaybeNullOrUndefined<number>
  cursor?: MaybeNullOrUndefined<string>
  publicOnly?: MaybeNullOrUndefined<boolean>
  streamIdWhitelist?: MaybeNullOrUndefined<string[]>
}) => Promise<{
  commits: LegacyUserCommit[]
  cursor: Nullable<string>
}>

export type LegacyGetPaginatedUserCommitsTotalCount = ({
  userId,
  publicOnly,
  streamIdWhitelist
}: {
  userId: string
  publicOnly?: MaybeNullOrUndefined<boolean>
  streamIdWhitelist?: MaybeNullOrUndefined<string[]>
}) => Promise<number>

export type LegacyGetPaginatedStreamCommitsPage = (params: {
  streamId: string
  limit?: MaybeNullOrUndefined<number>
  cursor?: MaybeNullOrUndefined<string>
  ignoreGlobalsBranch?: MaybeNullOrUndefined<boolean>
}) => Promise<{
  commits: LegacyStreamCommit[]
  cursor: Nullable<string>
}>

export type LegacyGetPaginatedStreamCommits = (
  streamId: string,
  params: StreamCommitsArgs
) => Promise<{
  items: LegacyStreamCommit[]
  cursor: Nullable<string>
  totalCount: number
}>
