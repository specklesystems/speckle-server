'use strict'
import knex from '@/db/knex'
import {
  getStreamBranchByName,
  getStreamBranchCount,
  createBranch as createBranchInDb
} from '@/modules/core/repositories/branches'
import {
  updateBranchAndNotify,
  deleteBranchAndNotify
} from '@/modules/core/services/branch/management'

const Branches = () => knex('branches')

/**
 * @deprecated Use `createBranchAndNotify` or use the repository function directly
 */
export async function createBranch({
  name,
  description,
  streamId,
  authorId
}: {
  name: string
  description: string
  streamId: string
  authorId: string
}) {
  const branch = await createBranchInDb({ name, description, streamId, authorId })
  return branch.id
}

/**
 * @deprecated Use 'updateBranchAndNotify'
 */
export async function updateBranch({
  id,
  name,
  description,
  streamId,
  userId
}: {
  id: string
  name: string
  description: string
  streamId: string
  userId: string
}) {
  const newBranch = await updateBranchAndNotify(
    { id, name, description, streamId },
    userId
  )
  return newBranch ? 1 : 0
}

export async function getBranchById({ id }: { id: string }) {
  return await Branches().where({ id }).first().select('*')
}

/**
 * @returns {Promise<{
 *  items: import('@/modules/core/helpers/types').BranchRecord[],
 *  cursor: string | null,
 *  totalCount: number
 * }>}
 */
export async function getBranchesByStreamId({
  streamId,
  limit,
  cursor
}: {
  streamId: string
  limit?: number
  cursor?: string | null
}) {
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
}

export async function getBranchesByStreamIdTotalCount({
  streamId
}: {
  streamId: string
}) {
  return await getStreamBranchCount(streamId)
}

export async function getBranchByNameAndStreamId({
  streamId,
  name
}: {
  streamId: string
  name: string
}) {
  return await getStreamBranchByName(streamId, name)
}

/**
 * @deprecated Use 'deleteBranchAndNotify'
 */
export async function deleteBranchById({
  id,
  streamId,
  userId
}: {
  id: string
  streamId: string
  userId: string
}) {
  return await deleteBranchAndNotify({ id, streamId }, userId)
}
