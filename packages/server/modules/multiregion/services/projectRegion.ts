import { StreamNotFoundError } from '@/modules/core/errors/stream'
import {
  AsyncRegionKeyStore,
  CachedRegionKeyLookup,
  RegionKeyLookupResult,
  StorageRegionKeyLookup,
  SyncRegionKeyLookup,
  SyncRegionKeyStore
} from '@/modules/multiregion/domain/operations'
import { Knex } from 'knex'

export type GetProjectRegionKey = (args: {
  projectId: string
}) => Promise<RegionKeyLookupResult>

export const getProjectRegionKeyFactory =
  ({
    getRegionKeyFromMemory,
    writeRegionToMemory,
    getRegionKeyFromCache,
    writeRegionKeyToCache,
    getRegionKeyFromStorage
  }: {
    getRegionKeyFromMemory: SyncRegionKeyLookup
    writeRegionToMemory: SyncRegionKeyStore
    getRegionKeyFromCache: CachedRegionKeyLookup
    writeRegionKeyToCache: AsyncRegionKeyStore
    getRegionKeyFromStorage: StorageRegionKeyLookup
  }): GetProjectRegionKey =>
  async ({ projectId }) => {
    let regionKey = getRegionKeyFromMemory({ projectId })
    // if undefined, cache missed
    if (regionKey !== undefined) return regionKey

    regionKey = await getRegionKeyFromCache({ projectId })
    // if undefined, cache missed
    if (regionKey !== undefined) {
      writeRegionToMemory({ projectId, regionKey })
      return regionKey
    }

    // if this returns null, means we're in the default region
    regionKey = await getRegionKeyFromStorage({ projectId })
    if (regionKey === undefined) throw new StreamNotFoundError()
    writeRegionToMemory({ projectId, regionKey })
    await writeRegionKeyToCache({ projectId, regionKey })
    return regionKey
  }

export type GetRegionDb = (args: { regionKey: string }) => Promise<Knex>
type GetDefaultDb = () => Knex

export type GetProjectDb = (args: { projectId: string }) => Promise<Knex>
export const getProjectDbClientFactory =
  ({
    getProjectRegionKey,
    getDefaultDb,
    getRegionDb
  }: {
    getProjectRegionKey: GetProjectRegionKey
    getDefaultDb: GetDefaultDb
    getRegionDb: GetRegionDb
  }): GetProjectDb =>
  async ({ projectId }) => {
    const regionKey = await getProjectRegionKey({ projectId })
    if (!regionKey) return getDefaultDb()
    return getRegionDb({ regionKey })
  }
