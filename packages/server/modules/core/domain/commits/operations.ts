import {
  BranchCommit,
  CommitWithStreamBranchMetadata,
  Commit,
  CommitBranch
} from '@/modules/core/domain/commits/types'
import {
  CommitUpdateInput,
  UpdateVersionInput
} from '@/modules/core/graph/generated/graphql'
import { BranchCommitRecord, StreamCommitRecord } from '@/modules/core/helpers/types'
import { BatchedSelectOptions } from '@/modules/shared/helpers/dbHelper'
import { MaybeNullOrUndefined, Nullable, Optional } from '@speckle/shared'
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
) => Promise<BranchCommit[]>

export type StoreCommit = (
  params: Omit<Commit, 'id' | 'createdAt'> & {
    message?: Nullable<string>
  }
) => Promise<Commit>

export type CreateCommitByBranchId = (
  params: {
    streamId: string
    branchId: string
    objectId: string
    authorId: string
    message: Nullable<string>
    sourceApplication: Nullable<string>
    totalChildrenCount?: MaybeNullOrUndefined<number>
    parents: Nullable<string[]>
  },
  options?: Partial<{
    notify: boolean
  }>
) => Promise<Commit>

export type CreateCommitByBranchName = (
  params: {
    streamId: string
    branchName: string
    objectId: string
    authorId: string
    message: Nullable<string>
    sourceApplication: Nullable<string>
    totalChildrenCount?: MaybeNullOrUndefined<number>
    parents: Nullable<string[]>
  },
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
) => Promise<Commit>

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
) => Promise<BranchCommit[]>

export type GetBatchedStreamCommits = (
  streamId: string,
  options?: Partial<BatchedSelectOptions>
) => AsyncGenerator<Commit[], void, unknown>

export type GetBatchedBranchCommits = (
  branchIds: string[],
  options?: Partial<BatchedSelectOptions>
) => AsyncGenerator<BranchCommitRecord[], void, unknown>

export type InsertCommits = (
  commits: Commit[],
  options?: Partial<{
    trx: Knex.Transaction
  }>
) => Promise<number[]>
