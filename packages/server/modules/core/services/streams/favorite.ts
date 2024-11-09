import {
  CanUserFavoriteStream,
  FavoriteStream,
  GetFavoritedStreamsCount,
  GetFavoritedStreamsPage,
  GetFavoriteStreamsCollection,
  GetStream,
  SetStreamFavorited
} from '@/modules/core/domain/streams/operations'
import { TokenResourceIdentifierType } from '@/modules/core/domain/tokens/types'
import { isResourceAllowed } from '@/modules/core/helpers/token'
import { UnauthorizedError } from '@/modules/shared/errors'
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

/**
 * Favorite or unfavorite a stream
 */
export const favoriteStreamFactory =
  (deps: {
    canUserFavoriteStream: CanUserFavoriteStream
    setStreamFavorited: SetStreamFavorited
    getStream: GetStream
  }): FavoriteStream =>
  async ({ userId, streamId, favorited, userResourceAccessRules }) => {
    // Check if user has access to stream
    const canFavorite = await deps.canUserFavoriteStream({ userId, streamId })
    const hasResourceAccess = isResourceAllowed({
      resourceId: streamId,
      resourceAccessRules: userResourceAccessRules,
      resourceType: TokenResourceIdentifierType.Project
    })
    if (!canFavorite || !hasResourceAccess) {
      throw new UnauthorizedError("User doesn't have access to the specified stream", {
        info: { userId, streamId }
      })
    }

    // Favorite/unfavorite the stream
    await deps.setStreamFavorited({ streamId, userId, favorited })

    // Get updated stream info
    const stream = await deps.getStream({ streamId, userId })
    return stream! // It should exist, cause we already checked that it does
  }
