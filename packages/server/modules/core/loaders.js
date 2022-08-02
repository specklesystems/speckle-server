const DataLoader = require('dataloader')
const {
  getBatchUserFavoriteData,
  getBatchStreamFavoritesCounts,
  getOwnedFavoritesCountByUserIds,
  getStreams
} = require('@/modules/core/repositories/streams')
const { getUsers } = require('@/modules/core/repositories/users')
const { keyBy } = require('lodash')
const { getInvites } = require('@/modules/serverinvites/repositories')

/**
 * All DataLoaders available on the GQL ctx object
 * @typedef {Object} RequestDataLoaders
 * @property {{
 *  getUserFavoriteData: DataLoader<string, {}>,
 *  getFavoritesCount: DataLoader<string, number>,
 *  getOwnedFavoritesCount: DataLoader<string, number>,
 *  getStream: DataLoader<string, {}>
 * }} streams
 * @property {{
 *  getUser: DataLoader<string, import('@/modules/core/helpers/userHelper').UserRecord>
 * }} users
 * @property {{
 *  getInvite: DataLoader<string, import('@/modules/serverinvites/repositories').ServerInviteRecord>
 * }} invites
 */

module.exports = {
  /**
   * Build request-scoped dataloaders
   * @param {import('@/modules/shared/index').AuthContextPart} ctx GraphQL context w/o loaders
   * @returns {RequestDataLoaders}
   */
  buildRequestLoaders(ctx) {
    const userId = ctx.userId

    return {
      streams: {
        /**
         * Get favorite metadata for a specific stream and user
         */
        getUserFavoriteData: new DataLoader(async (streamIds) => {
          if (!userId) {
            return streamIds.map(() => null)
          }

          const results = await getBatchUserFavoriteData({ userId, streamIds })
          return streamIds.map((k) => results[k])
        }),

        /**
         * Get amount of favorites for a specific stream
         */
        getFavoritesCount: new DataLoader(async (streamIds) => {
          const results = await getBatchStreamFavoritesCounts(streamIds)
          return streamIds.map((k) => results[k] || 0)
        }),

        /**
         * Get total amount of favorites of owned streams
         */
        getOwnedFavoritesCount: new DataLoader(async (userIds) => {
          const results = await getOwnedFavoritesCountByUserIds(userIds)
          return userIds.map((i) => results[i])
        }),

        /**
         * Get stream from DB
         *
         * Note: Considering the difficulty of writing a single query that queries for multiple stream IDs
         * and multiple user IDs also, currently this dataloader will only use a single userId
         */
        getStream: new DataLoader(async (streamIds) => {
          const results = keyBy(await getStreams(streamIds), 'id')
          return streamIds.map((i) => results[i])
        })
      },
      users: {
        /**
         * Get user from DB
         */
        getUser: new DataLoader(async (userIds) => {
          const results = keyBy(await getUsers(userIds), 'id')
          return userIds.map((i) => results[i])
        })
      },
      invites: {
        /**
         * Get invite from DB
         */
        getInvite: new DataLoader(async (inviteIds) => {
          const results = keyBy(await getInvites(inviteIds), 'id')
          return inviteIds.map((i) => results[i])
        })
      }
    }
  }
}
