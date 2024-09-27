import { CommitRecord } from '@/modules/core/helpers/types'

export type Commit = CommitRecord
export type BranchLatestCommit = Commit & {
  branchId: string
}
