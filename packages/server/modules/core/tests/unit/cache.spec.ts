import { describe } from 'mocha'
import {
  CacheProvider,
  retrieveViaCacheFactory
} from '@/modules/core/utils/cacheHandler'
import cryptoRandomString from 'crypto-random-string'
import { expect } from 'chai'

describe('utils cache @core', () => {
  describe('bust cache is enabled', () => {
    it('should return from source and update the cache with new value', async () => {
      const key = cryptoRandomString({ length: 10 })
      const prefix = cryptoRandomString({ length: 5 })
      const mockInMemoryCache: CacheProvider<string> = {
        get: () => Promise.resolve('fromInMemory'),
        set: (keyToSet: string, value: string) => {
          expect(keyToSet).to.equal(`${prefix}:${key}`)
          expect(value).to.equal('fromSource')
          return Promise.resolve()
        }
      }
      const getViaCache = retrieveViaCacheFactory<string>({
        cache: mockInMemoryCache,
        retrieveFromSource: async () => 'fromSource',
        options: {
          prefix
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
      it('should return from cache', async () => {
        const key = cryptoRandomString({ length: 10 })
        const prefix = cryptoRandomString({ length: 5 })
        const mockInMemoryCache: CacheProvider<string> = {
          get: () => Promise.resolve('fromInMemory'),
          set: () => {
            expect(true, 'Key should not have been set').to.equal(false)
            return Promise.reject()
          }
        }
        const getFromCache = retrieveViaCacheFactory<string>({
          cache: mockInMemoryCache,
          retrieveFromSource: async () => 'fromSource',
          options: {
            prefix
          }
        })
        const result = await getFromCache({
          key,
          bustCache: false
        })
        expect(result).to.equal('fromInMemory')
      })
    })
    describe('key is not in the cache', () => {
      it('should return from source and update the cache with new value', async () => {
        const key = cryptoRandomString({ length: 10 })
        const prefix = cryptoRandomString({ length: 5 })
        const mockInMemoryCache: CacheProvider<string> = {
          get: () => Promise.resolve(undefined),
          set: (keyToSet: string, value: string) => {
            expect(keyToSet).to.equal(`${prefix}:${key}`)
            expect(value).to.equal('fromSource')
            return Promise.resolve()
          }
        }
        const getFromCache = retrieveViaCacheFactory<string>({
          cache: mockInMemoryCache,
          retrieveFromSource: async () => 'fromSource',
          options: {
            prefix
          }
        })
        const result = await getFromCache({
          key,
          bustCache: false
        })
        expect(result).to.equal('fromSource')
      })
    })
  })
})
