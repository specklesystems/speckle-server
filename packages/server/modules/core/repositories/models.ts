import { StoreModel } from '@/modules/core/domain/projects/operations'
import { createBranchFactory } from '@/modules/core/repositories/branches'
import { Knex } from 'knex'

export const storeModelFactory =
  ({ db }: { db: Knex }): StoreModel =>
  async ({ authorId, projectId, name, description }) => {
    await createBranchFactory({ db })({
      authorId,
      description,
      name,
      streamId: projectId
    })
  }
