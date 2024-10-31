import {
  CreateAndValidateNewRegion,
  GetFreeRegionKeys,
  GetRegion,
  StoreRegion
} from '@/modules/multiregion/domain/operations'
import { RegionCreateError } from '@/modules/multiregion/errors'

export const createAndValidateNewRegionFactory =
  (deps: {
    getFreeRegionKeys: GetFreeRegionKeys
    getRegion: GetRegion
    storeRegion: StoreRegion
  }): CreateAndValidateNewRegion =>
  async (params) => {
    const { region } = params

    const [existingRegion, freeKeys] = await Promise.all([
      deps.getRegion({ key: region.key }),
      deps.getFreeRegionKeys()
    ])

    if (existingRegion) {
      throw new RegionCreateError('Region with this key already exists', {
        info: { region }
      })
    }
    if (!freeKeys.includes(region.key)) {
      throw new RegionCreateError('Region key is not valid or already in use', {
        info: { region, freeKeys }
      })
    }

    return await deps.storeRegion({ region })
  }
