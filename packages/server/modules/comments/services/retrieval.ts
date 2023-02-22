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
import { isUndefined } from 'lodash'

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

  const alreadyRequestingArchivedOnly = !!params.filter?.archivedOnly

  const [result, totalCount, totalArchivedCount] = await Promise.all([
    getPaginatedProjectCommentsDb(params, { preloadedModelLatestVersions }),
    getPaginatedProjectCommentsTotalCount(params, { preloadedModelLatestVersions }),
    alreadyRequestingArchivedOnly
      ? undefined
      : getPaginatedProjectCommentsTotalCount(
          { ...params, filter: { ...(params.filter || {}), archivedOnly: true } },
          { preloadedModelLatestVersions }
        )
  ])

  return {
    ...result,
    totalCount,
    totalArchivedCount: isUndefined(totalArchivedCount)
      ? totalCount
      : totalArchivedCount
  }
}
