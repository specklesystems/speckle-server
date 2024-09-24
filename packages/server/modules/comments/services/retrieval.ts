import { Optional } from '@speckle/shared'
import {
  getPaginatedProjectComments as getPaginatedProjectCommentsDb,
  getPaginatedProjectCommentsTotalCount,
  PaginatedProjectCommentsParams,
  resolvePaginatedProjectCommentsLatestModelResources
} from '@/modules/comments/repositories/comments'
import { getBranchLatestCommits } from '@/modules/core/repositories/branches'
import { isUndefined } from 'lodash'
import {
  GetPaginatedBranchCommentsFactory,
  GetPaginatedBranchCommentsPage,
  GetPaginatedBranchCommentsTotalCount,
  GetPaginatedCommitComments,
  GetPaginatedCommitCommentsPage,
  GetPaginatedCommitCommentsTotalCount,
  PaginatedBranchCommentsParams,
  PaginatedCommitCommentsParams
} from '@/modules/comments/domain/operations'

export const getPaginatedCommitCommentsFactory =
  (deps: {
    getPaginatedCommitCommentsPage: GetPaginatedCommitCommentsPage
    getPaginatedCommitCommentsTotalCount: GetPaginatedCommitCommentsTotalCount
  }): GetPaginatedCommitComments =>
  async (params: PaginatedCommitCommentsParams) => {
    const [result, totalCount] = await Promise.all([
      deps.getPaginatedCommitCommentsPage(params),
      deps.getPaginatedCommitCommentsTotalCount(params)
    ])

    return {
      ...result,
      totalCount
    }
  }

export const getPaginatedBranchCommentsFactory =
  (deps: {
    getPaginatedBranchCommentsPage: GetPaginatedBranchCommentsPage
    getPaginatedBranchCommentsTotalCount: GetPaginatedBranchCommentsTotalCount
  }): GetPaginatedBranchCommentsFactory =>
  async (params: PaginatedBranchCommentsParams) => {
    const [result, totalCount] = await Promise.all([
      deps.getPaginatedBranchCommentsPage(params),
      deps.getPaginatedBranchCommentsTotalCount(params)
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
