import type { PaginatedBranchCommentsParams, PaginatedCommitCommentsParams, PaginatedProjectCommentsOptions, PaginatedProjectCommentsParams } from '@/modules/comments/domain'
import { GetPaginatedBranchComments, GetPaginatedBranchCommentsTotalCount, GetPaginatedCommitComments, GetPaginatedCommitCommentsTotalCount, GetPaginatedProjectComments, GetPaginatedProjectCommentsTotalCount, ResolvePaginatedProjectCommentsLatestModelResources } from '@/modules/comments/domain/operations'
import { isUndefined } from 'lodash'

export const getPaginatedBranchCommentsWithCountFactory =
  ({
    getPaginatedBranchComments,
    getPaginatedBranchCommentsTotalCount
  }: {
    getPaginatedBranchComments: GetPaginatedBranchComments,
    getPaginatedBranchCommentsTotalCount: GetPaginatedBranchCommentsTotalCount
  }) =>
    async (params: PaginatedBranchCommentsParams) => {
      const [result, totalCount] = await Promise.all([
        getPaginatedBranchComments(params),
        getPaginatedBranchCommentsTotalCount(params)
      ])

      return {
        ...result,
        totalCount
      }
    }

export const getPaginatedCommitCommentsWithCountFactory =
  ({
    getPaginatedCommitComments,
    getPaginatedCommitCommentsTotalCount
  }: {
    getPaginatedCommitComments: GetPaginatedCommitComments,
    getPaginatedCommitCommentsTotalCount: GetPaginatedCommitCommentsTotalCount
  }) =>
    async (params: PaginatedCommitCommentsParams) => {
      const [result, totalCount] = await Promise.all([
        getPaginatedCommitComments(params),
        getPaginatedCommitCommentsTotalCount(params)
      ])

      return {
        ...result,
        totalCount
      }
    }

export const getPaginatedProjectCommentsWithCountFactory =
  ({
    getPaginatedProjectComments,
    getPaginatedProjectCommentsTotalCount,
    resolvePaginatedProjectCommentsLatestModelResources
  }: {
    getPaginatedProjectComments: GetPaginatedProjectComments,
    getPaginatedProjectCommentsTotalCount: GetPaginatedProjectCommentsTotalCount,
    resolvePaginatedProjectCommentsLatestModelResources: ResolvePaginatedProjectCommentsLatestModelResources
  }) =>
    async (params: PaginatedProjectCommentsParams) => {
      let preloadedModelLatestVersions: PaginatedProjectCommentsOptions['preloadedModelLatestVersions'] = undefined

      // optimization to ensure we don't request this stuff twice
      if (!params.filter?.allModelVersions && params.filter?.resourceIdString) {
        preloadedModelLatestVersions =
          await resolvePaginatedProjectCommentsLatestModelResources(
            params.filter.resourceIdString
          )
      }

      const alreadyRequestingArchivedOnly = !!params.filter?.archivedOnly

      const [result, totalCount, totalArchivedCount] = await Promise.all([
        getPaginatedProjectComments(params, { preloadedModelLatestVersions }),
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