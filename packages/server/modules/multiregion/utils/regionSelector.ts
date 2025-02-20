import { mainDb } from '@/db/knex'
import { isMultiRegionEnabled } from '@/modules/multiregion/helpers'
import { getAvailableRegionConfig } from '@/modules/multiregion/regionConfig'
import { getRegionsFactory } from '@/modules/multiregion/repositories'
import {
  getRegionKeyFromCacheFactory,
  getRegionKeyFromStorageFactory,
  inMemoryRegionKeyStoreFactory,
  writeRegionKeyToCacheFactory
} from '@/modules/multiregion/repositories/projectRegion'
import {
  GetProjectRegionKey,
  getProjectRegionKeyFactory
} from '@/modules/multiregion/services/projectRegion'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { getGenericRedis } from '@/modules/shared/redis/redis'
import { Optional } from '@speckle/shared'
import { DataRegionsConfig } from '@speckle/shared/dist/esm/environment/multiRegionConfig.js'

export const getRegisteredRegionConfigs = async () => {
  const registeredKeys = (await getRegionsFactory({ db: mainDb })()).map((r) => r.key)
  if (!registeredKeys.length) return {}

  const availableConfigs = await getAvailableRegionConfig()
  const result: DataRegionsConfig = {}

  for (const key of registeredKeys) {
    const config = availableConfigs[key]
    if (!config) {
      throw new MisconfiguredEnvironmentError(`Missing region config for ${key} region`)
    }

    result[key] = config
  }

  return result
}

export const getRegisteredRegionConfig = async (params: { regionKey: string }) => {
  const availableConfigs = await getRegisteredRegionConfigs()
  const config = availableConfigs[params.regionKey]
  if (!config) return undefined

  return config
}

let cachedProjectRegionKeyResolver: Optional<GetProjectRegionKey> = undefined

const buildProjectRegionKeyResolver = async (): Promise<GetProjectRegionKey> => {
  // if multi region is not enabled, lets fall back to the main region ALWAYS
  if (!isMultiRegionEnabled()) return async () => null

  const { getRegionKey, writeRegion } = inMemoryRegionKeyStoreFactory()

  const redis = getGenericRedis()

  const getProjectRegionKey = getProjectRegionKeyFactory({
    getRegionKeyFromMemory: getRegionKey,
    writeRegionToMemory: writeRegion,
    getRegionKeyFromCache: getRegionKeyFromCacheFactory({ redis }),
    writeRegionKeyToCache: writeRegionKeyToCacheFactory({ redis }),
    getRegionKeyFromStorage: getRegionKeyFromStorageFactory({ db: mainDb })
  })

  return getProjectRegionKey
}

export const getProjectRegionKey: GetProjectRegionKey = async ({ projectId }) => {
  if (!cachedProjectRegionKeyResolver) {
    cachedProjectRegionKeyResolver = await buildProjectRegionKeyResolver()
  }

  return await cachedProjectRegionKeyResolver({ projectId })
}
