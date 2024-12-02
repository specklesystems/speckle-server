import { buildTableHelper } from '@/modules/core/dbSchema'
import {
  GetRegion,
  GetRegions,
  StoreRegion,
  UpdateRegion
} from '@/modules/multiregion/domain/operations'
import { RegionRecord } from '@/modules/multiregion/helpers/types'
import { Knex } from 'knex'
import { pick } from 'lodash'

export const Regions = buildTableHelper('regions', [
  'key',
  'name',
  'description',
  'createdAt',
  'updatedAt'
])

const tables = {
  regions: (db: Knex) => db<RegionRecord>(Regions.name)
}

export const getRegionsFactory =
  (deps: { db: Knex }): GetRegions =>
  async () => {
    return await tables.regions(deps.db).select('*')
  }

export const getRegionFactory =
  (deps: { db: Knex }): GetRegion =>
  async (params) => {
    return await tables
      .regions(deps.db)
      .where({
        [Regions.col.key]: params.key
      })
      .first()
  }

export const storeRegionFactory =
  (deps: { db: Knex }): StoreRegion =>
  async (params) => {
    const [region] = await tables
      .regions(deps.db)
      .insert(pick(params.region, Regions.withoutTablePrefix.cols))
      .returning('*')

    return region
  }

export const updateRegionFactory =
  (deps: { db: Knex }): UpdateRegion =>
  async (params) => {
    const [region] = await tables
      .regions(deps.db)
      .where({
        [Regions.col.key]: params.regionKey
      })
      .update(pick(params.region, Regions.withoutTablePrefix.cols))
      .returning('*')

    return region
  }
