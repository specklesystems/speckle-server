'use strict'
const knex = require('@/db/knex')
const { getStreamBranchCountFactory } = require('@/modules/core/repositories/branches')

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

    const totalCount = await getStreamBranchCountFactory({ db: knex })(streamId)
    const rows = await query
    return {
      items: rows,
      cursor: rows.length > 0 ? rows[rows.length - 1].updatedAt.toISOString() : null,
      totalCount
    }
  }
}
