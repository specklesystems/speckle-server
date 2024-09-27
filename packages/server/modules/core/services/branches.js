'use strict'
const knex = require('@/db/knex')
const { getStreamBranchCount } = require('@/modules/core/repositories/branches')
const { deleteBranchAndNotify } = require('@/modules/core/services/branch/management')

const Branches = () => knex('branches')

module.exports = {
  /**
   * @returns {Promise<{
   *  items: import('@/modules/core/helpers/types').BranchRecord[],
   *  cursor: string | null,
   *  totalCount: number
   * }>}
   */
  async getBranchesByStreamId({ streamId, limit, cursor }) {
    limit = limit || 25
    const query = Branches().select('*').where({ streamId })

    if (cursor) query.andWhere('createdAt', '>', cursor)
    query.orderBy('createdAt').limit(limit)

    const totalCount = await getStreamBranchCount(streamId)
    const rows = await query
    return {
      items: rows,
      cursor: rows.length > 0 ? rows[rows.length - 1].updatedAt.toISOString() : null,
      totalCount
    }
  },

  async getBranchesByStreamIdTotalCount({ streamId }) {
    return await getStreamBranchCount(streamId)
  },

  /**
   * @deprecated Use 'deleteBranchAndNotify'
   */
  async deleteBranchById({ id, streamId, userId }) {
    return await deleteBranchAndNotify({ id, streamId }, userId)
  }
}
