import type {
  CreateAndValidateNewRegion,
  GetFreeRegionKeys,
  GetRegion,
  InitializeRegion,
  ScheduleMultiregionJob,
  StoreRegion,
  UpdateAndValidateRegion,
  UpdateRegion
} from '@/modules/multiregion/domain/operations'
import {
  RegionKeyInvalidError,
  RegionKeyTakenError
} from '@/modules/multiregion/errors'
import { RegionUpdateError } from '@/modules/multiregion/errors'
import { removeNullOrUndefinedKeys } from '@speckle/shared'

export const createAndValidateNewRegionFactory =
  ({
    getFreeRegionKeys,
    getRegion,
    initializeRegion,
    storeRegion,
    scheduleJob
  }: {
    getFreeRegionKeys: GetFreeRegionKeys
    getRegion: GetRegion
    storeRegion: StoreRegion
    initializeRegion: InitializeRegion
    scheduleJob: ScheduleMultiregionJob
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

    const record = await storeRegion({ region })

    await scheduleJob({
      type: 'initialize-region-data',
      payload: {
        regionKey: region.key
      }
    })

    return record
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

export const initializeRegionClients =
  (deps: {
    initializeDb: InitializeRegion
    initializeBlobStorage: InitializeRegion
  }): InitializeRegion =>
  async ({ regionKey }) => {
    await Promise.all([
      deps.initializeDb({ regionKey }),
      deps.initializeBlobStorage({ regionKey })
    ])
  }
