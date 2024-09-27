import { CommitRecord } from '@/modules/core/helpers/types'

export type Commit = CommitRecord
export type BranchLatestCommit = Commit & {
  branchId: string
}
export type BranchCommit = BranchLatestCommit

export type CommitWithStreamBranchMetadata = Commit & {
  streamId: string
  branchId: string
  branchName: string
}
