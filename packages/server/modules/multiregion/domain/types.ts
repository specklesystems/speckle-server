import { RegionRecord } from '@/modules/multiregion/helpers/types'
import { Nullable } from '@speckle/shared'
import {
  DataRegionsConfig,
  RegionServerConfig
} from '@speckle/shared/environment/multiRegionConfig'

export { RegionServerConfig, DataRegionsConfig }
export type ServerRegion = RegionRecord

export type RegionKey = Nullable<string>
export type ProjectRegion = {
  projectId: string
  regionKey: RegionKey
}
