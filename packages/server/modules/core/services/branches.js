'use strict'
const knex = require('@/db/knex')
const {
  getStreamBranchByName,
  getStreamBranchCount,
  validateBranchName,
  createBranch: createBranchInDb
} = require('@/modules/core/repositories/branches')

const Streams = () => knex('streams')
const Branches = () => knex('branches')

module.exports = {
  /**
   * @deprecated Use `createBranchAndNotify` or use the repository function directly
   */
  async createBranch({ name, description, streamId, authorId }) {
    const branch = await createBranchInDb({ name, description, streamId, authorId })
    return branch.id
  },

  async updateBranch({ id, name, description }) {
    if (name) validateBranchName(name)
    return await Branches()
      .where({ id })
      .update({ name: name ? name.toLowerCase() : name, description })
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

  async deleteBranchById({ id, streamId }) {
    const branch = await module.exports.getBranchById({ id })
    if (branch.name === 'main') throw new Error('Cannot delete the main branch.')

    await Branches().where({ id }).del()
    await Streams().where({ id: streamId }).update({ updatedAt: knex.fn.now() })
    return true
  }
}
