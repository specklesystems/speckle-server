'use strict'
const crs = require('crypto-random-string')
const knex = require('@/db/knex')
const {
  getStreamBranchByName,
  getStreamBranchCount
} = require('@/modules/core/repositories/branches')

const Streams = () => knex('streams')
const Branches = () => knex('branches')

module.exports = {
  async createBranch({ name, description, streamId, authorId }) {
    const branch = {}
    branch.id = crs({ length: 10 })
    branch.streamId = streamId
    branch.authorId = authorId
    branch.name = name.toLowerCase()
    branch.description = description

    if (name) module.exports.validateBranchName({ name })

    await Branches().insert(branch)

    // update stream updated at
    await Streams().where({ id: streamId }).update({ updatedAt: knex.fn.now() })

    return branch.id
  },

  async updateBranch({ id, name, description }) {
    if (name) module.exports.validateBranchName({ name })
    return await Branches()
      .where({ id })
      .update({ name: name ? name.toLowerCase() : name, description })
  },

  validateBranchName({ name }) {
    if (name.startsWith('/') || name.startsWith('#') || name.indexOf('//') !== -1)
      throw new Error(
        'Bad name for branch. Branch names cannot start with "#" or "/", or have multiple slashes next to each other (e.g., "//").'
      )
  },

  async getBranchById({ id }) {
    return await Branches().where({ id }).first().select('*')
  },

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
