import { Model } from '@/modules/core/domain/branches/types'
import { GetModelById } from '@/modules/core/domain/models/operations'
import { StoreModel } from '@/modules/core/domain/projects/operations'
import { createBranchFactory } from '@/modules/core/repositories/branches'
import { Knex } from 'knex'

const tables = {
  models: (db: Knex) => db<Model>('branches')
}

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

export const getModelByIdFactory =
  ({ db }: { db: Knex }): GetModelById =>
  async ({ id }) => {
    return await tables.models(db).where({ id }).first()
  }
