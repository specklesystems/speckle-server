import { describe } from 'mocha'
import { InMemoryCache, retrieveViaCacheFactory } from '@/modules/core/utils/cache'
import cryptoRandomString from 'crypto-random-string'
import { expect } from 'chai'

describe('utils cache @core', () => {
  describe('bust cache is enabled', () => {
    it('should return from source and update the cache with new value', async () => {
      const key = cryptoRandomString({ length: 10 })
      const mockInMemoryCache: InMemoryCache<string> = {
        get: () => 'fromInMemory',
        set: (keyToSet: string, value: string) => {
          expect(keyToSet).to.equal(key)
          expect(value).to.equal('fromSource')
        }
      }
      const getViaCache = retrieveViaCacheFactory<string>({
        inMemoryCache: mockInMemoryCache,
        retrieveFromSource: async () => 'fromSource',
        options: {
          inMemoryTtlSeconds: 2 // it doesn't matter, as this is an implementation detail for the underlying cache
        }
      })
      const result = await getViaCache({
        key,
        bustCache: true
      })
      expect(result).to.equal('fromSource')
    })
  })
  describe('bust cache is disabled', () => {
    describe('key is in the cache', () => {
      //NB we don't test if the key has expired or not, as this is an implementation detail for the underlying cache
      it('should return from cache', async () => {
        const key = cryptoRandomString({ length: 10 })
        const mockInMemoryCache: InMemoryCache<string> = {
          get: () => 'fromInMemory',
          set: () => {
            expect(true, 'Key should not have been set').to.equal(false)
          }
        }
        const getFromLayeredCache = retrieveViaCacheFactory<string>({
          inMemoryCache: mockInMemoryCache,
          retrieveFromSource: async () => 'fromSource',
          options: {
            inMemoryTtlSeconds: 2 // it doesn't matter, as this is an implementation detail for the underlying cache
          }
        })
        const result = await getFromLayeredCache({
          key,
          bustCache: false
        })
        expect(result).to.equal('fromInMemory')
      })
    })
    describe('key is not in the cache', () => {
      it('should return from source and update the cache with new value', async () => {
        const key = cryptoRandomString({ length: 10 })
        const mockInMemoryCache: InMemoryCache<string> = {
          get: () => undefined,
          set: (keyToSet: string, value: string) => {
            expect(keyToSet).to.equal(key)
            expect(value).to.equal('fromSource')
          }
        }
        const getFromLayeredCache = retrieveViaCacheFactory<string>({
          inMemoryCache: mockInMemoryCache,
          retrieveFromSource: async () => 'fromSource',
          options: {
            inMemoryTtlSeconds: 2 // it doesn't matter, as this is an implementation detail for the underlying cache
          }
        })
        const result = await getFromLayeredCache({
          key,
          bustCache: false
        })
        expect(result).to.equal('fromSource')
      })
    })
  })
})
