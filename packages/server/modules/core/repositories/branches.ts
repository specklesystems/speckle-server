import { Branches, knex } from '@/modules/core/dbSchema'
import { BranchRecord } from '@/modules/core/helpers/types'
import {
  BatchedSelectOptions,
  executeBatchedSelect
} from '@/modules/shared/helpers/dbHelper'
import crs from 'crypto-random-string'
import { Knex } from 'knex'

export const generateBranchId = () => crs({ length: 10 })

export async function getStreamBranchByName(streamId: string, name: string) {
  if (!streamId || !name) return null

  const q = Branches.knex<BranchRecord>()
    .where(Branches.col.streamId, streamId)
    .andWhere(knex.raw('LOWER(name) = ?', [name.toLowerCase()]))

  return await q.first()
}

export function getBatchedStreamBranches(
  streamId: string,
  options?: Partial<BatchedSelectOptions>
) {
  const baseQuery = Branches.knex<BranchRecord[]>()
    .where(Branches.col.streamId, streamId)
    .orderBy(Branches.col.id)

  return executeBatchedSelect(baseQuery, options)
}

export async function insertBranches(
  branches: BranchRecord[],
  options?: Partial<{ trx: Knex.Transaction }>
) {
  const q = Branches.knex().insert(branches)
  if (options?.trx) q.transacting(options.trx)
  return await q
}
