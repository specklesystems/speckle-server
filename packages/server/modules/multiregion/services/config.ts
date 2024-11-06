import type {
  GetAvailableRegionConfig,
  GetAvailableRegionKeys,
  GetFreeRegionKeys,
  GetRegions
} from '@/modules/multiregion/domain/operations'

export const getAvailableRegionKeysFactory =
  ({
    getAvailableRegionConfig
  }: {
    getAvailableRegionConfig: GetAvailableRegionConfig
  }): GetAvailableRegionKeys =>
  async () => {
    const config = await getAvailableRegionConfig()
    return Object.keys(config)
  }

export const getFreeRegionKeysFactory =
  ({
    getAvailableRegionKeys,
    getRegions
  }: {
    getAvailableRegionKeys: GetAvailableRegionKeys
    getRegions: GetRegions
  }): GetFreeRegionKeys =>
  async () => {
    const [availableKeys, regions] = await Promise.all([
      getAvailableRegionKeys(),
      getRegions()
    ])

    const usedKeys = regions.map((r) => r.key)
    return availableKeys.filter((k) => !usedKeys.includes(k))
  }
