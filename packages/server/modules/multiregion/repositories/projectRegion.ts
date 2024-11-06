import {
  AsyncRegionKeyStore,
  CachedRegionKeyLookup,
  StorageRegionKeyLookup,
  SyncRegionKeyLookup,
  SyncRegionKeyStore
} from '@/modules/multiregion/domain/operations'
import { LRUCache } from 'lru-cache'
import Redis from 'ioredis'
import { Knex } from 'knex'
import { StreamRecord } from '@/modules/core/helpers/types'

const mainDbKey = 'mainDb'

export const inMemoryRegionKeyStoreFactory = (): {
  getRegionKey: SyncRegionKeyLookup
  writeRegion: SyncRegionKeyStore
} => {
  const cache = new LRUCache<string, string>({ max: 2000 })

  const getRegionKey: SyncRegionKeyLookup = ({ projectId }) => {
    const key = cache.get(projectId)
    if (key === mainDbKey) return null
    return key
  }

  const writeRegion: SyncRegionKeyStore = ({ projectId, regionKey }) => {
    const storedKey = regionKey || mainDbKey
    cache.set(projectId, storedKey)
  }

  return { getRegionKey, writeRegion }
}

export const getRegionKeyFromCacheFactory =
  ({ redis }: { redis: Redis }): CachedRegionKeyLookup =>
  async ({ projectId }) => {
    const regionKey = await redis.get(projectId)
    if (!regionKey) return undefined
    if (regionKey === mainDbKey) return null
    return regionKey
  }

export const writeRegionKeyToCacheFactory =
  ({ redis }: { redis: Redis }): AsyncRegionKeyStore =>
  async ({ projectId, regionKey }) => {
    const storedKey = regionKey || mainDbKey
    await redis.set(projectId, storedKey)
  }

const tables = {
  streams: (db: Knex) => db<StreamRecord>('streams')
}

export const getRegionKeyFromStorageFactory =
  ({ db }: { db: Knex }): StorageRegionKeyLookup =>
  async ({ projectId }) => {
    const projectRegion = await tables
      .streams(db)
      .select('id', 'regionKey')
      .where({ id: projectId })
      .first()

    if (!projectRegion) return projectRegion
    return projectRegion.regionKey
  }
