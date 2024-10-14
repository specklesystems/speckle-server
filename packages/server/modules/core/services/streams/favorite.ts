import {
  GetFavoritedStreamsCount,
  GetFavoritedStreamsPage,
  GetFavoriteStreamsCollection
} from '@/modules/core/domain/streams/operations'
import { clamp } from 'lodash'

/**
 * Get user favorited streams & metadata
 * @param {Object} p
 * @param {string} p.userId
 * @param {number} [p.limit] Defaults to 25
 * @param {string|null} [p.cursor] Optionally specify date after which to look for favorites
 * @param {string[] | undefined} [p.streamIdWhitelist] Optionally specify a list of stream IDs to filter by
 * @returns
 */
export const getFavoriteStreamsCollectionFactory =
  (deps: {
    getFavoritedStreamsCount: GetFavoritedStreamsCount
    getFavoritedStreamsPage: GetFavoritedStreamsPage
  }): GetFavoriteStreamsCollection =>
  async ({ userId, limit, cursor, streamIdWhitelist }) => {
    limit = clamp(limit || 25, 1, 25)

    // Get total count of favorited streams
    const totalCount = await deps.getFavoritedStreamsCount(userId, streamIdWhitelist)

    // Get paginated streams
    const { cursor: finalCursor, streams } = await deps.getFavoritedStreamsPage({
      userId,
      cursor,
      limit,
      streamIdWhitelist
    })

    return { totalCount, cursor: finalCursor, items: streams }
  }
