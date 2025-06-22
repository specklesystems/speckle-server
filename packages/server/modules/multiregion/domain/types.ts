import { RegionRecord } from '@/modules/multiregion/helpers/types'
import { Nullable } from '@speckle/shared'
import {
  DataRegionsConfig,
  RegionServerConfig
} from '@speckle/shared/environment/multiRegionConfig'
import { Knex } from 'knex'

export { RegionServerConfig, DataRegionsConfig }
export type ServerRegion = RegionRecord

export type RegionKey = Nullable<string>
export type ProjectRegion = {
  projectId: string
  regionKey: RegionKey
}

declare const regionDbSymbol: unique symbol
declare const projectDbSymbol: unique symbol

export type RegionDb = Knex & { [regionDbSymbol]: void }

// a project may be located in either the main db or a region db
export type ProjectDb = Knex & { [projectDbSymbol]: void }
