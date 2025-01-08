import { StreamNotFoundError } from '@/modules/core/errors/stream'
import {
  getProjectDbClientFactory,
  getProjectRegionKeyFactory
} from '@/modules/multiregion/services/projectRegion'
import { expectToThrow } from '@/test/assertionHelper'
import { Optional } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import { Knex } from 'knex'

describe('projectRegions @multiregion', () => {
  describe('getProjectRegionKeyFactory creates a function, that', () => {
    it('first returns from memory', async () => {
      const getProjectRegion = getProjectRegionKeyFactory({
        getRegionKeyFromMemory: () => null,
        writeRegionToMemory: () => {
          expect.fail()
        },
        getRegionKeyFromCache: () => {
          expect.fail()
        },
        writeRegionKeyToCache: () => {
          expect.fail()
        },
        getRegionKeyFromStorage: () => {
          expect.fail()
        }
      })
      const res = await getProjectRegion({
        projectId: cryptoRandomString({ length: 10 })
      })
      expect(res).to.be.null
    })
    it('writes to memory and returns from the cache if not found in memory', async () => {
      const regionKey = cryptoRandomString({ length: 10 })
      const projectId = cryptoRandomString({ length: 10 })
      let memoryKey: Optional<{ projectId: string; regionKey: string | null }> =
        undefined
      const getProjectRegion = getProjectRegionKeyFactory({
        getRegionKeyFromMemory: () => undefined,
        writeRegionToMemory: (projectRegion) => {
          memoryKey = projectRegion
        },
        getRegionKeyFromCache: async () => regionKey,
        writeRegionKeyToCache: () => {
          expect.fail()
        },
        getRegionKeyFromStorage: () => {
          expect.fail()
        }
      })
      const res = await getProjectRegion({ projectId })
      expect(res).to.be.equal(regionKey)
      expect(memoryKey).deep.equal({ projectId, regionKey })
    })
    it('throws StreamNotFoundError if the project is not in the storage', async () => {
      const getProjectRegion = getProjectRegionKeyFactory({
        getRegionKeyFromMemory: () => undefined,
        writeRegionToMemory: () => {
          expect.fail()
        },
        getRegionKeyFromCache: async () => undefined,
        writeRegionKeyToCache: async () => {
          expect.fail()
        },
        getRegionKeyFromStorage: async () => undefined
      })
      const err = await expectToThrow(
        async () =>
          await getProjectRegion({ projectId: cryptoRandomString({ length: 10 }) })
      )
      expect(err.message).to.be.equal(new StreamNotFoundError().message)
    })
    it('writes to cache and memory and returns from storage if not found before', async () => {
      const regionKey = cryptoRandomString({ length: 10 })
      const projectId = cryptoRandomString({ length: 10 })
      let memoryKey: Optional<{ projectId: string; regionKey: string | null }> =
        undefined

      let cacheKey: Optional<{ projectId: string; regionKey: string | null }> =
        undefined
      const getProjectRegion = getProjectRegionKeyFactory({
        getRegionKeyFromMemory: () => undefined,
        writeRegionToMemory: (projectRegion) => {
          memoryKey = projectRegion
        },
        getRegionKeyFromCache: async () => undefined,
        writeRegionKeyToCache: async (projectRegion) => {
          cacheKey = projectRegion
        },
        getRegionKeyFromStorage: async () => regionKey
      })
      const res = await getProjectRegion({ projectId })
      expect(res).to.be.equal(regionKey)
      expect(memoryKey).deep.equal({ projectId, regionKey })
      expect(cacheKey).deep.equal({ projectId, regionKey })
    })
  })
  describe('getProjectDbClientFactory creates a function, that', () => {
    it('returns the db from getDefaultDb if regionKey is null', async () => {
      const db = {} as unknown as Knex
      const getProjectDbClient = getProjectDbClientFactory({
        getProjectRegionKey: async () => null,
        getDefaultDb: () => db,
        getRegionDb: () => {
          expect.fail()
        }
      })
      const res = await getProjectDbClient({
        projectId: cryptoRandomString({ length: 10 })
      })
      expect(res).to.equal(db)
    })
    it('returns the fb from getRegionDb if there is a regionKey', async () => {
      const db = {} as unknown as Knex
      const getProjectDbClient = getProjectDbClientFactory({
        getProjectRegionKey: async () => cryptoRandomString({ length: 10 }),
        getDefaultDb: () => {
          expect.fail()
        },
        getRegionDb: async () => db
      })
      const res = await getProjectDbClient({
        projectId: cryptoRandomString({ length: 10 })
      })
      expect(res).to.equal(db)
    })
  })
})
