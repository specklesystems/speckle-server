import { Branch } from '@/modules/core/domain/branches/types'
import {
  BranchRecord,
  CommitRecord,
  StreamCommitRecord,
  StreamRecord,
  UserRecord
} from '@/modules/core/helpers/types'

export type Commit = CommitRecord
export type CommitWithBranchId = Commit & {
  branchId: string
}
export type CommitWithStreamId = Commit & { streamId: string }
export type BranchLatestCommit = CommitWithBranchId

export type CommitWithStreamBranchId = Commit & {
  streamId: string
  branchId: string
}

export type CommitWithStreamBranchMetadata = CommitWithStreamBranchId & {
  branchName: string
}

export type CommitBranch = Branch & { commitId: string }

export type LegacyUserCommit = {
  id: CommitRecord['id']
  message: CommitRecord['message']
  referencedObject: CommitRecord['referencedObject']
  sourceApplication: CommitRecord['sourceApplication']
  totalChildrenCount: CommitRecord['totalChildrenCount']
  parents: CommitRecord['parents']
  createdAt: CommitRecord['createdAt']
  branchName: BranchRecord['name']
  branchId: BranchRecord['id']
  streamId: StreamCommitRecord['streamId']
  streamName: StreamRecord['name']
  authorName: UserRecord['name']
  authorId: UserRecord['id']
  authorAvatar: UserRecord['avatar']
}

export type LegacyStreamCommit = {
  id: CommitRecord['id']
  message: CommitRecord['message']
  referencedObject: CommitRecord['referencedObject']
  sourceApplication: CommitRecord['sourceApplication']
  totalChildrenCount: CommitRecord['totalChildrenCount']
  parents: CommitRecord['parents']
  createdAt: CommitRecord['createdAt']
  branchName: BranchRecord['name']
  branchId: BranchRecord['id']
  streamId: StreamCommitRecord['streamId']
  authorName: UserRecord['name']
  authorId: UserRecord['id']
  authorAvatar: UserRecord['avatar']
  author: UserRecord['id']
}
