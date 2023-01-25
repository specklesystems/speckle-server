'use strict'
const knex = require('@/db/knex')
const {
  getStreamBranchByName,
  getStreamBranchCount,
  createBranch: createBranchInDb
} = require('@/modules/core/repositories/branches')
const {
  updateBranchAndNotify,
  deleteBranchAndNotify
} = require('@/modules/core/services/branch/management')

const Branches = () => knex('branches')

module.exports = {
  /**
   * @deprecated Use `createBranchAndNotify` or use the repository function directly
   */
  async createBranch({ name, description, streamId, authorId }) {
    const branch = await createBranchInDb({ name, description, streamId, authorId })
    return branch.id
  },

  /**
   * @deprecated Use 'updateBranchAndNotify'
   */
  async updateBranch({ id, name, description, streamId, userId }) {
    const newBranch = await updateBranchAndNotify(
      { id, name, description, streamId },
      userId
    )
    return newBranch ? 1 : 0
  },

  async getBranchById({ id }) {
    return await Branches().where({ id }).first().select('*')
  },

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

  async getBranchByNameAndStreamId({ streamId, name }) {
    return await getStreamBranchByName(streamId, name)
  },

  /**
   * @deprecated Use 'deleteBranchAndNotify'
   */
  async deleteBranchById({ id, streamId, userId }) {
    return await deleteBranchAndNotify({ id, streamId }, userId)
  }
}
