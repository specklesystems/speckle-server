import {
  BranchCommit,
  CommitWithStreamBranchMetadata,
  Commit
} from '@/modules/core/domain/commits/types'
import { BranchCommitRecord, StreamCommitRecord } from '@/modules/core/helpers/types'
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
