import {
  BranchCommit,
  CommitWithStreamBranchMetadata
} from '@/modules/core/domain/commits/types'
import { Optional } from '@speckle/shared'

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
