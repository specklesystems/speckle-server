import { db } from '@/db/knex'
import { isMultiRegionEnabled } from '@/modules/multiregion/helpers'
import {
  getRegionKeyFromCacheFactory,
  getRegionKeyFromStorageFactory,
  inMemoryRegionKeyStoreFactory,
  writeRegionKeyToCacheFactory
} from '@/modules/multiregion/repositories/projectRegion'
import {
  GetProjectDb,
  getProjectDbClientFactory,
  getProjectRegionKeyFactory,
  getRegionDbFactory
} from '@/modules/multiregion/services/projectRegion'
import { getGenericRedis } from '@/modules/core'
import knex, { Knex } from 'knex'
import { getRegionsFactory } from '@/modules/multiregion/repositories'
import { getAvailableRegionConfigsFactory } from '@/modules/multiregion/services/config'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { createKnexConfig } from '@/knexfile'

let getter: GetProjectDb | undefined = undefined

const initializeDbGetter = async (): Promise<GetProjectDb> => {
  const getDefaultDb = () => db

  // if multi region is not enabled, lets fall back to the main Db always
  if (!isMultiRegionEnabled()) return async () => getDefaultDb()

  const getRegionDb = getRegionDbFactory({
    regionClients: await getRegionClients()
  })

  const { getRegionKey, writeRegion } = inMemoryRegionKeyStoreFactory()

  const redis = getGenericRedis()

  const getProjectRegionKey = getProjectRegionKeyFactory({
    getRegionKeyFromMemory: getRegionKey,
    writeRegionToMemory: writeRegion,
    getRegionKeyFromCache: getRegionKeyFromCacheFactory({ redis }),
    writeRegionKeyToCache: writeRegionKeyToCacheFactory({ redis }),
    getRegionKeyFromStorage: getRegionKeyFromStorageFactory({ db: getDefaultDb() })
  })

  return getProjectDbClientFactory({
    getDefaultDb,
    getRegionDb,
    getProjectRegionKey
  })
}

// this guy is the star of the show here
export const getProjectDbClient: GetProjectDb = async ({ projectId }) => {
  if (!getter) getter = await initializeDbGetter()
  return await getter({ projectId })
}

type RegionClients = Record<string, Knex>
let regionClients: RegionClients | undefined = undefined

const configureRegionClients = async (): Promise<RegionClients> => {
  const configuredRegions = await getRegionsFactory({ db })()
  const regionConfigs = await getAvailableRegionConfigsFactory()()

  return Object.fromEntries(
    configuredRegions.map((region) => {
      const config = regionConfigs[region.key]
      if (!config)
        throw new MisconfiguredEnvironmentError(
          `Missing region config for ${region.key} region`
        )

      const knexConfig = createKnexConfig({
        connectionString: config.postgres.connectionUri,
        caCertificate: config.postgres.publicTlsCertificate
      })

      return [region.key, knex(knexConfig)]
    })
  )
}

export const getRegionClients = async (): Promise<RegionClients> => {
  if (!regionClients) regionClients = await configureRegionClients()
  return regionClients
}
