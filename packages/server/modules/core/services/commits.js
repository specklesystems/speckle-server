'use strict'
const knex = require('@/db/knex')
const { getStreamBranchByNameFactory } = require('@/modules/core/repositories/branches')
const {
  getBranchCommitsTotalCountFactory,
  getPaginatedBranchCommitsItemsFactory
} = require('@/modules/core/repositories/commits')

const StreamCommits = () => knex('stream_commits')
const { clamp } = require('lodash')

module.exports = {
  async getCommitsTotalCountByBranchName({ streamId, branchName }) {
    branchName = branchName.toLowerCase()
    const getStreamBranchByName = getStreamBranchByNameFactory({ db: knex })
    const myBranch = await getStreamBranchByName(streamId, branchName)

    if (!myBranch) throw new Error(`Failed to find branch with name ${branchName}.`)

    const getBranchCommitsTotalCount = getBranchCommitsTotalCountFactory({ db: knex })

    return getBranchCommitsTotalCount({ branchId: myBranch.id })
  },

  async getCommitsByBranchName({ streamId, branchName, limit, cursor }) {
    branchName = branchName.toLowerCase()
    const getStreamBranchByName = getStreamBranchByNameFactory({ db: knex })
    const myBranch = await getStreamBranchByName(streamId, branchName)

    if (!myBranch) throw new Error(`Failed to find branch with name ${branchName}.`)

    const getPaginatedBranchCommits = getPaginatedBranchCommitsItemsFactory({
      db: knex
    })
    return getPaginatedBranchCommits({ branchId: myBranch.id, limit, cursor })
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
  }
}
