'use strict'
const knex = require('@/db/knex')

const Commits = () => knex('commits')
const StreamCommits = () => knex('stream_commits')

const { getBranchByNameAndStreamId } = require('./branches')

const {
  getStreamCommitCount,
  getPaginatedBranchCommits,
  getBranchCommitsTotalCount
} = require('@/modules/core/repositories/commits')
const {
  createCommitByBranchName: createCommitByBranchNameNew,
  updateCommitAndNotify,
  deleteCommitAndNotify
} = require('@/modules/core/services/commit/management')

const getCommitsByUserIdBase = ({ userId, publicOnly }) => {
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

  return query
}

module.exports = {
  /**
   * @deprecated Use 'createCommitByBranchName()' in 'management.ts'
   */
  async createCommitByBranchName({
    streamId,
    branchName,
    objectId,
    authorId,
    message,
    sourceApplication,
    totalChildrenCount,
    parents
  }) {
    const { id } = await createCommitByBranchNameNew({
      streamId,
      branchName,
      objectId,
      authorId,
      message,
      sourceApplication,
      totalChildrenCount,
      parents
    })

    return id
  },

  /**
   * @deprecated Use 'updateCommitAndNotify()'
   */
  async updateCommit({ streamId, id, message, newBranchName, userId }) {
    await updateCommitAndNotify({ streamId, id, message, newBranchName }, userId)
    return true
  },

  async getCommitById({ streamId, id }) {
    const query = await Commits()
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
        { authorAvatar: 'users.avatar' }
      ])
      .select()
      .join('stream_commits', 'commits.id', 'stream_commits.commitId')
      .join('branch_commits', 'commits.id', 'branch_commits.commitId')
      .join('branches', 'branches.id', 'branch_commits.branchId')
      .leftJoin('users', 'commits.author', 'users.id')
      .where({ 'stream_commits.streamId': streamId, 'commits.id': id })
      .first()
    return await query
  },

  /**
   * @deprecated Use 'deleteCommitAndNotify()'
   */
  async deleteCommit({ commitId, streamId, userId }) {
    return await deleteCommitAndNotify(commitId, streamId, userId)
  },

  /**
   * @deprecated Use `getBranchCommitsTotalCount()` instead
   */
  async getCommitsTotalCountByBranchId({ branchId }) {
    return await getBranchCommitsTotalCount({ branchId })
  },

  async getCommitsTotalCountByBranchName({ streamId, branchName }) {
    branchName = branchName.toLowerCase()
    const myBranch = await getBranchByNameAndStreamId({
      streamId,
      name: branchName
    })

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
    const myBranch = await getBranchByNameAndStreamId({
      streamId,
      name: branchName
    })

    if (!myBranch) throw new Error(`Failed to find branch with name ${branchName}.`)

    return module.exports.getCommitsByBranchId({ branchId: myBranch.id, limit, cursor })
  },

  async getCommitsTotalCountByStreamId({ streamId, ignoreGlobalsBranch }) {
    return await getStreamCommitCount(streamId, { ignoreGlobalsBranch })
  },

  /**
   * @returns {Promise<{
   *  commits: import('@/modules/core/helpers/types').CommitRecord[],
   *  cursor: string | null
   * }>}
   */
  async getCommitsByStreamId({ streamId, limit, cursor, ignoreGlobalsBranch }) {
    limit = limit || 25
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
        { authorAvatar: 'users.avatar' }
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

  async getCommitsByUserId({ userId, limit, cursor, publicOnly }) {
    limit = limit || 25
    publicOnly = publicOnly !== false

    const query = getCommitsByUserIdBase({ userId, publicOnly })

    if (cursor) query.andWhere('commits.createdAt', '<', cursor)

    query.orderBy('commits.createdAt', 'desc').limit(limit)

    const rows = await query
    return {
      commits: rows,
      cursor: rows.length > 0 ? rows[rows.length - 1].createdAt.toISOString() : null
    }
  },

  async getCommitsTotalCountByUserId({ userId, publicOnly }) {
    const query = getCommitsByUserIdBase({ userId, publicOnly })
    query.clearSelect()
    query.select(knex.raw('COUNT(*) as count'))

    const [res] = await query
    return parseInt(res.count)
  }
}
