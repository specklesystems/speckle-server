import type { RegionRecord } from '@/modules/multiregion/helpers/types'
import type { Nullable } from '@speckle/shared'
import { DataRegionsConfig, RegionServerConfig } from '@speckle/shared/environment/db'

export { RegionServerConfig, DataRegionsConfig }
export type ServerRegion = RegionRecord

export type RegionKey = Nullable<string>
export type ProjectRegion = {
  projectId: string
  regionKey: RegionKey
}
