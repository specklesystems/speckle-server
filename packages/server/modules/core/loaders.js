const DataLoader = require('dataloader')
const {
  getBatchUserFavoriteData,
  getBatchStreamFavoritesCounts
} = require('@/modules/core/repositories/streams')

/**
 * All DataLoaders available on the GQL ctx object
 * @typedef {Object} RequestDataLoaders
 * @property {{
 *  getUserFavoriteData: DataLoader<string, {}>,
 *  getFavoritesCount: DataLoader<string, number>
 * }} streams
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
        })
      }
    }
  }
}
