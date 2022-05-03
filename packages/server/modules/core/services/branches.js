'use strict'
const crs = require('crypto-random-string')
const knex = require('@/db/knex')

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
    if (name.startsWith('/') || name.startsWith('#'))
      throw new Error('Branch names cannot start with # or /.')
  },

  async getBranchById({ id }) {
    return await Branches().where({ id }).first().select('*')
  },

  async getBranchesByStreamId({ streamId, limit, cursor }) {
    limit = limit || 25
    const query = Branches().select('*').where({ streamId })

    if (cursor) query.andWhere('createdAt', '<', cursor)
    query.orderBy('createdAt').limit(limit)

    const totalCount = await module.exports.getBranchesByStreamIdTotalCount({
      streamId
    })
    const rows = await query
    return {
      items: rows,
      cursor: rows.length > 0 ? rows[rows.length - 1].updatedAt.toISOString() : null,
      totalCount
    }
  },

  async getBranchesByStreamIdTotalCount({ streamId }) {
    const [res] = await Branches().count().where({ streamId })
    return parseInt(res.count)
  },

  async getBranchByNameAndStreamId({ streamId, name }) {
    const query = Branches()
      .select('*')
      .where({ streamId })
      .andWhere(knex.raw('LOWER(name) = ?', [name.toLowerCase()]))
      .first()
    return await query
  },

  async deleteBranchById({ id, streamId }) {
    const branch = await module.exports.getBranchById({ id })
    if (branch.name === 'main') throw new Error('Cannot delete the main branch.')

    await Branches().where({ id }).del()
    await Streams().where({ id: streamId }).update({ updatedAt: knex.fn.now() })
    return true
  }
}
