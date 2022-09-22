import { Branches, knex } from '@/modules/core/dbSchema'
import { BranchRecord } from '@/modules/core/helpers/types'

export async function getStreamBranchByName(streamId: string, name: string) {
  if (!streamId || !name) return null

  const q = Branches.knex<BranchRecord>()
    .where(Branches.col.streamId, streamId)
    .andWhere(knex.raw('LOWER(name) = ?', [name.toLowerCase()]))

  return await q.first()
}
