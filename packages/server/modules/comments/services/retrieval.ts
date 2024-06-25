import type { CommentsRepository, PaginatedBranchCommentsParams, PaginatedCommitCommentsParams, PaginatedProjectCommentsOptions, PaginatedProjectCommentsParams } from '@/modules/comments/domain'
import { isUndefined } from 'lodash'

export const getPaginatedBranchComments =
  /** Factory function */
  ({ commentsRepository }: { commentsRepository: Pick<CommentsRepository, 'getPaginatedBranchComments' | 'getPaginatedBranchCommentsTotalCount'> }) =>
    /** Service function */
    async (params: PaginatedBranchCommentsParams) => {
      const { getPaginatedBranchComments, getPaginatedBranchCommentsTotalCount } = commentsRepository

      const [result, totalCount] = await Promise.all([
        getPaginatedBranchComments(params),
        getPaginatedBranchCommentsTotalCount(params)
      ])

      return {
        ...result,
        totalCount
      }
    }

export const getPaginatedCommitComments =
  /** Factory function */
  ({ commentsRepository }: { commentsRepository: Pick<CommentsRepository, 'getPaginatedCommitComments' | 'getPaginatedCommitCommentsTotalCount'> }) =>
    /** Service function */
    async (params: PaginatedCommitCommentsParams) => {
      const { getPaginatedCommitComments, getPaginatedCommitCommentsTotalCount } = commentsRepository

      const [result, totalCount] = await Promise.all([
        getPaginatedCommitComments(params),
        getPaginatedCommitCommentsTotalCount(params)
      ])

      return {
        ...result,
        totalCount
      }
    }

export const getPaginatedProjectComments =
  /** Factory function */
  ({ commentsRepository }: { commentsRepository: Pick<CommentsRepository, 'getPaginatedProjectComments' | 'getPaginatedProjectCommentsTotalCount' | 'resolvePaginatedProjectCommentsLatestModelResources'> }) =>
    /** Service function */
    async (params: PaginatedProjectCommentsParams) => {
      const {
        getPaginatedProjectComments,
        getPaginatedProjectCommentsTotalCount,
        resolvePaginatedProjectCommentsLatestModelResources
      } = commentsRepository

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