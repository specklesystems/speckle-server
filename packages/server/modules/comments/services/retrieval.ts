import type { CommentsRepository, PaginatedBranchCommentsParams, PaginatedCommitCommentsParams, PaginatedProjectCommentsOptions, PaginatedProjectCommentsParams } from '@/modules/comments/domain'
import { isUndefined } from 'lodash'

type GetPaginatedBranchCommentsDeps = {
  getPaginatedBranchComments: CommentsRepository['getPaginatedBranchComments'],
  getPaginatedBranchCommentsTotalCount: CommentsRepository['getPaginatedBranchCommentsTotalCount']
}

export const getPaginatedBranchComments =
  /** Factory function */
  (deps: GetPaginatedBranchCommentsDeps) =>
    /** Service function */
    async (params: PaginatedBranchCommentsParams) => {
      const { getPaginatedBranchComments, getPaginatedBranchCommentsTotalCount } = deps

      const [result, totalCount] = await Promise.all([
        getPaginatedBranchComments(params),
        getPaginatedBranchCommentsTotalCount(params)
      ])

      return {
        ...result,
        totalCount
      }
    }

type GetPaginatedCommitCommentsDeps = {
  getPaginatedCommitComments: CommentsRepository['getPaginatedCommitComments'],
  getPaginatedCommitCommentsTotalCount: CommentsRepository['getPaginatedCommitCommentsTotalCount']
}

export const getPaginatedCommitComments =
  /** Factory function */
  (deps: GetPaginatedCommitCommentsDeps) =>
    /** Service function */
    async (params: PaginatedCommitCommentsParams) => {
      const { getPaginatedCommitComments, getPaginatedCommitCommentsTotalCount } = deps

      const [result, totalCount] = await Promise.all([
        getPaginatedCommitComments(params),
        getPaginatedCommitCommentsTotalCount(params)
      ])

      return {
        ...result,
        totalCount
      }
    }


type GetPaginatedProjectCommentsDeps = {
  getPaginatedProjectComments: CommentsRepository['getPaginatedProjectComments'],
  getPaginatedProjectCommentsTotalCount: CommentsRepository['getPaginatedProjectCommentsTotalCount'],
  resolvePaginatedProjectCommentsLatestModelResources: CommentsRepository['resolvePaginatedProjectCommentsLatestModelResources'],
}

export const getPaginatedProjectComments =
  /** Factory function */
  (deps: GetPaginatedProjectCommentsDeps) =>
    /** Service function */
    async (params: PaginatedProjectCommentsParams) => {
      const {
        getPaginatedProjectComments,
        getPaginatedProjectCommentsTotalCount,
        resolvePaginatedProjectCommentsLatestModelResources
      } = deps

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