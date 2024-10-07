'use strict'
const knex = require('@/db/knex')
const { getStreamBranchByNameFactory } = require('@/modules/core/repositories/branches')

const Commits = () => knex('commits')
const StreamCommits = () => knex('stream_commits')

const {
  getPaginatedBranchCommits,
  getBranchCommitsTotalCount
} = require('@/modules/core/repositories/commits')
const { clamp } = require('lodash')

const getCommitsByUserIdBase = ({ userId, publicOnly, streamIdWhitelist }) => {
  publicOnly = publicOnly !== false

  const query = Commits()
    .columns([
      { id: 'commits.id' },
      'message',
      'referencedObject',
      'sourceApplication',
      'totalChildrenCount',
      'parents',
      'commits.createdAt',
      { branchName: 'branches.name' },
      { streamId: 'stream_commits.streamId' },
      { streamName: 'streams.name' },
      { authorName: 'users.name' },
      { authorId: 'users.id' },
      { authorAvatar: 'users.avatar' }
    ])
    .select()
    .join('stream_commits', 'commits.id', 'stream_commits.commitId')
    .join('streams', 'stream_commits.streamId', 'streams.id')
    .join('branch_commits', 'commits.id', 'branch_commits.commitId')
    .join('branches', 'branches.id', 'branch_commits.branchId')
    .leftJoin('users', 'commits.author', 'users.id')
    .where('author', userId)

  if (publicOnly) query.andWhere('streams.isPublic', true)
  if (streamIdWhitelist?.length) query.whereIn('streams.streamId', streamIdWhitelist)

  return query
}

module.exports = {
  /**
   * @deprecated Use `getBranchCommitsTotalCount()` instead
   */
  async getCommitsTotalCountByBranchId({ branchId }) {
    return await getBranchCommitsTotalCount({ branchId })
  },

  async getCommitsTotalCountByBranchName({ streamId, branchName }) {
    branchName = branchName.toLowerCase()
    const getStreamBranchByName = getStreamBranchByNameFactory({ db: knex })
    const myBranch = await getStreamBranchByName(streamId, branchName)

    if (!myBranch) throw new Error(`Failed to find branch with name ${branchName}.`)

    return module.exports.getCommitsTotalCountByBranchId({ branchId: myBranch.id })
  },

  /**
   * @deprecated Use `getPaginatedBranchCommits()` instead and `getBranchCommitsTotalCount()` for the total count
   */
  async getCommitsByBranchId({ branchId, limit, cursor }) {
    return await getPaginatedBranchCommits({ branchId, limit, cursor })
  },

  async getCommitsByBranchName({ streamId, branchName, limit, cursor }) {
    branchName = branchName.toLowerCase()
    const getStreamBranchByName = getStreamBranchByNameFactory({ db: knex })
    const myBranch = await getStreamBranchByName(streamId, branchName)

    if (!myBranch) throw new Error(`Failed to find branch with name ${branchName}.`)

    return module.exports.getCommitsByBranchId({ branchId: myBranch.id, limit, cursor })
  },

  /**
   * @returns {Promise<{
   *  commits: import('@/modules/core/helpers/types').CommitRecord[],
   *  cursor: string | null
   * }>}
   */
  async getCommitsByStreamId({ streamId, limit, cursor, ignoreGlobalsBranch }) {
    limit = clamp(limit || 25, 0, 100)
    if (!limit) return { commits: [], cursor: null }

    const query = StreamCommits()
      .columns([
        { id: 'commits.id' },
        'message',
        'referencedObject',
        'sourceApplication',
        'totalChildrenCount',
        'parents',
        'commits.createdAt',
        { branchName: 'branches.name' },
        { authorName: 'users.name' },
        { authorId: 'users.id' },
        { authorAvatar: 'users.avatar' },
        knex.raw(`?? as "author"`, ['users.id'])
      ])
      .select()
      .join('commits', 'commits.id', 'stream_commits.commitId')
      .join('branch_commits', 'commits.id', 'branch_commits.commitId')
      .join('branches', 'branches.id', 'branch_commits.branchId')
      .leftJoin('users', 'commits.author', 'users.id')
      .where('stream_commits.streamId', streamId)

    if (ignoreGlobalsBranch) query.andWhere('branches.name', '!=', 'globals')

    if (cursor) query.andWhere('commits.createdAt', '<', cursor)

    query.orderBy('commits.createdAt', 'desc').limit(limit)

    const rows = await query
    return {
      commits: rows,
      cursor: rows.length > 0 ? rows[rows.length - 1].createdAt.toISOString() : null
    }
  },

  async getCommitsByUserId({ userId, limit, cursor, publicOnly, streamIdWhitelist }) {
    limit = limit || 25
    publicOnly = publicOnly !== false

    const query = getCommitsByUserIdBase({ userId, publicOnly, streamIdWhitelist })

    if (cursor) query.andWhere('commits.createdAt', '<', cursor)

    query.orderBy('commits.createdAt', 'desc').limit(limit)

    const rows = await query
    return {
      commits: rows,
      cursor: rows.length > 0 ? rows[rows.length - 1].createdAt.toISOString() : null
    }
  },

  async getCommitsTotalCountByUserId({ userId, publicOnly, streamIdWhitelist }) {
    const query = getCommitsByUserIdBase({ userId, publicOnly, streamIdWhitelist })
    query.clearSelect()
    query.select(knex.raw('COUNT(*) as count'))

    const [res] = await query
    return parseInt(res.count)
  }
}
