import type {
  AsyncRegionKeyStore,
  CachedRegionKeyDelete,
  CachedRegionKeyLookup,
  StorageRegionKeyLookup,
  StorageRegionKeyUpdate,
  SyncRegionKeyLookup,
  SyncRegionKeyStore
} from '@/modules/multiregion/domain/operations'
import { LRUCache } from 'lru-cache'
import type Redis from 'ioredis'
import type { Knex } from 'knex'
import type { StreamRecord } from '@/modules/core/helpers/types'
import { TIME_MS } from '@speckle/shared'

const mainDbKey = 'mainDb'

export const inMemoryRegionKeyStoreFactory = (): {
  getRegionKey: SyncRegionKeyLookup
  writeRegion: SyncRegionKeyStore
} => {
  const cache = new LRUCache<string, string>({
    max: 2000,
    /** ttl in ms */
    ttl: 10 * TIME_MS.minute,
    /** Do not return expired values */
    allowStale: false
  })

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

export const deleteRegionKeyFromCacheFactory =
  ({ redis }: { redis: Redis }): CachedRegionKeyDelete =>
  async ({ projectId }) => {
    await redis.del(projectId)
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

export const upsertProjectRegionKeyFactory =
  ({ db }: { db: Knex }): StorageRegionKeyUpdate =>
  async ({ projectId, regionKey }) => {
    const projects = await tables
      .streams(db)
      .where({ id: projectId })
      .update({ regionKey })
      .returning('*')

    return projects.at(0)
  }
