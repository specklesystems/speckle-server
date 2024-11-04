import {
  CreateAndValidateNewRegion,
  GetFreeRegionKeys,
  GetRegion,
  StoreRegion,
  UpdateAndValidateRegion,
  UpdateRegion
} from '@/modules/multiregion/domain/operations'
import { RegionCreateError, RegionUpdateError } from '@/modules/multiregion/errors'
import { removeNullOrUndefinedKeys } from '@speckle/shared'

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
      throw new RegionCreateError('Region key is not valid', {
        info: { region, freeKeys }
      })
    }

    return await deps.storeRegion({ region })
  }

export const updateAndValidateRegionFactory =
  (deps: {
    getRegion: GetRegion
    updateRegion: UpdateRegion
  }): UpdateAndValidateRegion =>
  async (params) => {
    const { input } = params

    const region = await deps.getRegion({ key: input.key })
    if (!region) {
      throw new RegionUpdateError('Region not found', { info: { input } })
    }

    const update = removeNullOrUndefinedKeys(input)
    if (Object.keys(update).length === 0) {
      return region
    }

    return await deps.updateRegion({ regionKey: input.key, region: update })
  }
