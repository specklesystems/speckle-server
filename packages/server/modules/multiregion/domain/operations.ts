import { MultiRegionConfig } from '@/modules/multiregion/domain/types'

export type GetAvailableRegionConfigs = () => Promise<MultiRegionConfig>
export type GetAvailableRegionKeys = () => Promise<string[]>
