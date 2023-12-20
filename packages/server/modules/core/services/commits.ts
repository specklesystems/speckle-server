'use strict'
import knex from '@/db/knex'

const Commits = () => knex('commits')
const StreamCommits = () => knex('stream_commits')

import { getBranchByNameAndStreamId } from './branches'

import {
  getStreamCommitCount,
  getPaginatedBranchCommits,
  getBranchCommitsTotalCount
} from '@/modules/core/repositories/commits'
import {
  createCommitByBranchName as createCommitByBranchNameNew,
  updateCommitAndNotify,
  deleteCommitAndNotify
} from '@/modules/core/services/commit/management'
import { clamp } from 'lodash'
import { SourceAppName } from '@speckle/shared'

const getCommitsByUserIdBase = ({
  userId,
  publicOnly
}: {
  userId: string
  publicOnly: boolean
}) => {
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

/**
 * @deprecated Use 'createCommitByBranchName()' in 'management.ts'
 */
export async function createCommitByBranchName({
  streamId,
  branchName,
  objectId,
  authorId,
  message,
  sourceApplication,
  totalChildrenCount,
  parents
}: {
  streamId: string
  branchName: string
  objectId: string
  authorId: string
  message: string
  sourceApplication: SourceAppName
  totalChildrenCount: number | null
  parents: string[] | null
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
}

/**
 * @deprecated Use 'updateCommitAndNotify()'
 */
export async function updateCommit({
  streamId,
  id,
  message,
  newBranchName,
  userId
}: {
  streamId: string
  id: string
  message: string
  newBranchName: string
  userId: string
}) {
  await updateCommitAndNotify({ streamId, id, message, newBranchName }, userId)
  return true
}

export async function getCommitById({
  streamId,
  id
}: {
  streamId: string
  id: string
}) {
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
}

/**
 * @deprecated Use 'deleteCommitAndNotify()'
 */
export async function deleteCommit({
  commitId,
  streamId,
  userId
}: {
  commitId: string
  streamId: string
  userId: string
}) {
  return await deleteCommitAndNotify(commitId, streamId, userId)
}

/**
 * @deprecated Use `getBranchCommitsTotalCount()` instead
 */
export async function getCommitsTotalCountByBranchId({
  branchId
}: {
  branchId: string
}) {
  return await getBranchCommitsTotalCount({ branchId })
}

export async function getCommitsTotalCountByBranchName({
  streamId,
  branchName
}: {
  streamId: string
  branchName: string
}) {
  branchName = branchName.toLowerCase()
  const myBranch = await getBranchByNameAndStreamId({
    streamId,
    name: branchName
  })

  if (!myBranch) throw new Error(`Failed to find branch with name ${branchName}.`)

  return module.exports.getCommitsTotalCountByBranchId({ branchId: myBranch.id })
}

/**
 * @deprecated Use `getPaginatedBranchCommits()` instead and `getBranchCommitsTotalCount()` for the total count
 */
export async function getCommitsByBranchId({
  branchId,
  limit,
  cursor
}: {
  branchId: string
  limit: number
  cursor: string
}) {
  return await getPaginatedBranchCommits({ branchId, limit, cursor })
}

export async function getCommitsByBranchName({
  streamId,
  branchName,
  limit,
  cursor
}: {
  streamId: string
  branchName: string
  limit: number
  cursor: string
}) {
  branchName = branchName.toLowerCase()
  const myBranch = await getBranchByNameAndStreamId({
    streamId,
    name: branchName
  })

  if (!myBranch) throw new Error(`Failed to find branch with name ${branchName}.`)

  return module.exports.getCommitsByBranchId({ branchId: myBranch.id, limit, cursor })
}

export async function getCommitsTotalCountByStreamId({
  streamId,
  ignoreGlobalsBranch
}: {
  streamId: string
  ignoreGlobalsBranch: boolean
}) {
  return await getStreamCommitCount(streamId, { ignoreGlobalsBranch })
}

/**
 * @returns {Promise<{
 *  commits: import('@/modules/core/helpers/types').CommitRecord[],
 *  cursor: string | null
 * }>}
 */
export async function getCommitsByStreamId({
  streamId,
  limit,
  cursor,
  ignoreGlobalsBranch
}: {
  streamId: string
  limit?: number
  cursor?: string | null
  ignoreGlobalsBranch?: boolean
}) {
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
}

export async function getCommitsByUserId({
  userId,
  limit,
  cursor,
  publicOnly
}: {
  userId: string
  limit: number
  cursor: string
  publicOnly: boolean
}) {
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
}

export async function getCommitsTotalCountByUserId({
  userId,
  publicOnly
}: {
  userId: string
  publicOnly: boolean
}) {
  const query = getCommitsByUserIdBase({ userId, publicOnly })
  query.clearSelect()
  query.select(knex.raw('COUNT(*) as count'))

  const [res] = await query
  return parseInt(res.count)
}
