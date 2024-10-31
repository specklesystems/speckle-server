import { Optional } from '@speckle/shared'
import { isUndefined } from 'lodash'
import {
  GetPaginatedBranchCommentsFactory,
  GetPaginatedBranchCommentsPage,
  GetPaginatedBranchCommentsTotalCount,
  GetPaginatedCommitComments,
  GetPaginatedCommitCommentsPage,
  GetPaginatedCommitCommentsTotalCount,
  GetPaginatedProjectComments,
  GetPaginatedProjectCommentsPage,
  GetPaginatedProjectCommentsTotalCount,
  PaginatedBranchCommentsParams,
  PaginatedCommitCommentsParams,
  PaginatedProjectCommentsParams,
  ResolvePaginatedProjectCommentsLatestModelResources
} from '@/modules/comments/domain/operations'
import { BranchLatestCommit } from '@/modules/core/domain/commits/types'

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

export const getPaginatedProjectCommentsFactory =
  (deps: {
    resolvePaginatedProjectCommentsLatestModelResources: ResolvePaginatedProjectCommentsLatestModelResources
    getPaginatedProjectCommentsPage: GetPaginatedProjectCommentsPage
    getPaginatedProjectCommentsTotalCount: GetPaginatedProjectCommentsTotalCount
  }): GetPaginatedProjectComments =>
  async (params: PaginatedProjectCommentsParams) => {
    let preloadedModelLatestVersions: Optional<BranchLatestCommit[]> = undefined
    // optimization to ensure we don't request this stuff twice
    if (!params.filter?.allModelVersions && params.filter?.resourceIdString) {
      preloadedModelLatestVersions =
        await deps.resolvePaginatedProjectCommentsLatestModelResources(
          params.filter.resourceIdString
        )
    }

    const alreadyRequestingArchivedOnly = !!params.filter?.archivedOnly

    const [result, totalCount, totalArchivedCount] = await Promise.all([
      deps.getPaginatedProjectCommentsPage(params, { preloadedModelLatestVersions }),
      deps.getPaginatedProjectCommentsTotalCount(params, {
        preloadedModelLatestVersions
      }),
      alreadyRequestingArchivedOnly
        ? undefined
        : deps.getPaginatedProjectCommentsTotalCount(
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
