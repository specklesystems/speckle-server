import { Branch } from '@/modules/core/domain/branches/types'
import { CommitRecord } from '@/modules/core/helpers/types'

export type Commit = CommitRecord
export type CommitWithBranchId = Commit & {
  branchId: string
}
export type CommitWithStreamId = Commit & { streamId: string }
export type BranchLatestCommit = CommitWithBranchId

export type CommitWithStreamBranchMetadata = Commit & {
  streamId: string
  branchId: string
  branchName: string
}

export type CommitBranch = Branch & { commitId: string }
