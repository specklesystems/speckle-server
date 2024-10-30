import { RegionServerConfig } from '@/modules/multiregion/domain/types'

export type GetAvailableRegionConfigs = () => Promise<{
  [key: string]: RegionServerConfig
}>
