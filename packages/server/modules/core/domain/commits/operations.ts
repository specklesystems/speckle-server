import { CommitWithStreamBranchMetadata } from '@/modules/core/domain/commits/types'
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
