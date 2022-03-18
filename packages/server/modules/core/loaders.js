const _ = require('lodash')
const { StreamFavorites, knex } = require('@/modules/core/dbSchema')
const DataLoader = require('dataloader')

/**
 * All DataLoaders available on the GQL ctx object
 * @typedef {Object} RequestDataLoaders
 * @property {{
 *  getUserFavoriteData: DataLoader<string, Object>,
 *  getFavoritesCount: DataLoader<string, number>
 * }} streams
 */

module.exports = {
  /**
   * Build request-scoped dataloaders
   * @param {Object} ctx GraphQL context
   * @returns {RequestDataLoaders}
   */
  buildRequestLoaders(ctx) {
    const userId = ctx.userId

    return {
      streams: {
        /**
         * Get favorite metadata for a specific stream and user
         */
        getUserFavoriteData: new DataLoader(async (keys) => {
          const query = StreamFavorites.knex()
            .select()
            .where(StreamFavorites.col.userId, userId)
            .whereIn(StreamFavorites.col.streamId, keys)

          const rows = await query
          const keyedRows = _.keyBy(rows, 'streamId')

          return keys.map((k) => keyedRows[k])
        }),

        /**
         * Get amount of favorites for a specific stream
         */
        getFavoritesCount: new DataLoader(async (keys) => {
          const query = StreamFavorites.knex()
            .select()
            .columns([StreamFavorites.col.streamId, knex.raw('COUNT(*) as count')])
            .whereIn(StreamFavorites.col.streamId, keys)
            .groupBy(StreamFavorites.col.streamId)

          const rows = await query
          const keyedRows = _.keyBy(rows, 'streamId')

          return keys.map((k) => keyedRows[k]?.count || 0)
        })
      }
    }
  }
}
