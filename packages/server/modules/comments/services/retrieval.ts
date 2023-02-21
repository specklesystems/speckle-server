import { Optional } from '@speckle/shared'
import {
  PaginatedCommitCommentsParams,
  getPaginatedCommitComments as getPaginatedCommitCommentsDb,
  getPaginatedCommitCommentsTotalCount,
  PaginatedBranchCommentsParams,
  getPaginatedBranchComments as getPaginatedBranchCommentsDb,
  getPaginatedBranchCommentsTotalCount,
  getPaginatedProjectComments as getPaginatedProjectCommentsDb,
  getPaginatedProjectCommentsTotalCount,
  PaginatedProjectCommentsParams,
  resolvePaginatedProjectCommentsLatestModelResources
} from '@/modules/comments/repositories/comments'
import { getBranchLatestCommits } from '@/modules/core/repositories/branches'

export async function getPaginatedCommitComments(
  params: PaginatedCommitCommentsParams
) {
  const [result, totalCount] = await Promise.all([
    getPaginatedCommitCommentsDb(params),
    getPaginatedCommitCommentsTotalCount(params)
  ])

  return {
    ...result,
    totalCount
  }
}

export async function getPaginatedBranchComments(
  params: PaginatedBranchCommentsParams
) {
  const [result, totalCount] = await Promise.all([
    getPaginatedBranchCommentsDb(params),
    getPaginatedBranchCommentsTotalCount(params)
  ])

  return {
    ...result,
    totalCount
  }
}

export async function getPaginatedProjectComments(
  params: PaginatedProjectCommentsParams
) {
  let preloadedModelLatestVersions: Optional<
    Awaited<ReturnType<typeof getBranchLatestCommits>>
  > = undefined
  // optimization to ensure we don't request this stuff twice
  if (!params.filter?.allModelVersions && params.filter?.resourceIdString) {
    preloadedModelLatestVersions =
      await resolvePaginatedProjectCommentsLatestModelResources(
        params.filter.resourceIdString
      )
  }

  const [result, totalCount] = await Promise.all([
    getPaginatedProjectCommentsDb(params, { preloadedModelLatestVersions }),
    getPaginatedProjectCommentsTotalCount(params, { preloadedModelLatestVersions })
  ])

  return {
    ...result,
    totalCount
  }
}
