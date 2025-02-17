import {
  getRegionKeyFromCacheFactory,
  getRegionKeyFromStorageFactory,
  inMemoryRegionKeyStoreFactory,
  writeRegionKeyToCacheFactory
} from '@/modules/multiregion/repositories/projectRegion'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import { createInmemoryRedisClient } from '@/test/redisHelper'
import { createStreamFactory } from '@/modules/core/repositories/streams'
import { db } from '@/db/knex'
import { storeRegionFactory } from '@/modules/multiregion/repositories'
import { truncateRegionsSafely } from '@/test/speckle-helpers/regions'

describe('projectRegion repositories @multiregion', () => {
  after(async () => {
    await truncateRegionsSafely()
  })

  describe('inMemoryKeyStoreFactory creates an object, which', () => {
    const { getRegionKey, writeRegion } = inMemoryRegionKeyStoreFactory()
    it('returns undefined if projectId is not in the cache', () => {
      const regionKey = getRegionKey({ projectId: cryptoRandomString({ length: 10 }) })
      expect(regionKey).to.be.undefined
    })
    it('returns null if null region key is wrote for the projectId', () => {
      const projectId = cryptoRandomString({ length: 10 })
      writeRegion({ projectId, regionKey: null })
      const regionKey = getRegionKey({ projectId })
      expect(regionKey).to.be.null
    })
    it('returns the region key', () => {
      const projectId = cryptoRandomString({ length: 10 })
      const key = cryptoRandomString({ length: 10 })
      writeRegion({ projectId, regionKey: key })
      const regionKey = getRegionKey({ projectId })
      expect(regionKey).to.equal(key)
    })
  })
  describe('getRegionKeyFromCacheFactory returns a function, that', () => {
    const getRegionKeyFromCache = getRegionKeyFromCacheFactory({
      redis: createInmemoryRedisClient()
    })
    const writeRegionKeyToCache = writeRegionKeyToCacheFactory({
      redis: createInmemoryRedisClient()
    })
    it('returns undefined if projectId is not in the cache', async () => {
      const projectId = cryptoRandomString({ length: 10 })
      const regionKey = await getRegionKeyFromCache({ projectId })
      expect(regionKey).to.be.undefined
    })
    it('returns null if null region key is wrote for the projectId', async () => {
      const projectId = cryptoRandomString({ length: 10 })
      const key = null
      await writeRegionKeyToCache({ projectId, regionKey: key })
      const regionKey = await getRegionKeyFromCache({ projectId })
      expect(regionKey).to.be.null
    })
    it('returns the region key', async () => {
      const projectId = cryptoRandomString({ length: 10 })
      const key = cryptoRandomString({ length: 10 })
      await writeRegionKeyToCache({ projectId, regionKey: key })
      const regionKey = await getRegionKeyFromCache({ projectId })
      expect(regionKey).to.equal(key)
    })
  })
  describe('getRegionKeyFromStorageFactory returns a function, that', () => {
    const getRegionKeyFromStorage = getRegionKeyFromStorageFactory({
      db
    })
    const saveProject = createStreamFactory({ db })
    it('returns undefined if projectId is not store', async () => {
      const projectId = cryptoRandomString({ length: 10 })
      const regionKey = await getRegionKeyFromStorage({ projectId })
      expect(regionKey).to.be.undefined
    })
    it('returns null if null region key is wrote for the projectId', async () => {
      const key = null
      const { id } = await saveProject({
        name: cryptoRandomString({ length: 10 }),
        regionKey: key
      })

      const regionKey = await getRegionKeyFromStorage({ projectId: id })
      expect(regionKey).to.be.null
    })
    it('returns the region key', async () => {
      const key = cryptoRandomString({ length: 10 })
      await storeRegionFactory({ db })({
        region: { key, name: cryptoRandomString({ length: 10 }) }
      })
      const { id } = await saveProject({
        name: cryptoRandomString({ length: 10 }),
        regionKey: key
      })
      const regionKey = await getRegionKeyFromStorage({ projectId: id })
      expect(regionKey).to.equal(key)
    })
  })
})
