import {
  CreateAndValidateNewRegion,
  GetFreeRegionKeys,
  GetRegion,
  InitializeRegion,
  StoreRegion
} from '@/modules/multiregion/domain/operations'
import {
  RegionKeyInvalidError,
  RegionKeyTakenError
} from '@/modules/multiregion/errors'

export const createAndValidateNewRegionFactory =
  ({
    getFreeRegionKeys,
    getRegion,
    initializeRegion,
    storeRegion
  }: {
    getFreeRegionKeys: GetFreeRegionKeys
    getRegion: GetRegion
    storeRegion: StoreRegion
    initializeRegion: InitializeRegion
  }): CreateAndValidateNewRegion =>
  async ({ region }) => {
    const [existingRegion, freeKeys] = await Promise.all([
      getRegion({ key: region.key }),
      getFreeRegionKeys()
    ])

    if (existingRegion) {
      throw new RegionKeyTakenError(null, {
        info: { region }
      })
    }
    if (!freeKeys.includes(region.key)) {
      throw new RegionKeyInvalidError(null, {
        info: { region, freeKeys }
      })
    }

    await initializeRegion({ regionKey: region.key })

    return await storeRegion({ region })
  }
