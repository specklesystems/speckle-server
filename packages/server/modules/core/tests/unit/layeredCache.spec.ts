import { describe } from 'mocha'
import { InMemoryCache, layeredCacheFactory } from '@/modules/core/utils/layeredCache'
import cryptoRandomString from 'crypto-random-string'
import { expect } from 'chai'
import Redis from 'ioredis'

describe('Layered cache @core', () => {
  describe('with Memory cache only (without distributed cache)', () => {
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
        const getFromLayeredCache = layeredCacheFactory<string>({
          inMemoryCache: mockInMemoryCache,
          distributedCache: undefined,
          retrieveFromSource: async () => 'fromSource',
          options: {
            inMemoryExpiryTimeSeconds: 2, // it doesn't matter, as this is an implementation detail for the underlying cache
            redisExpiryTimeSeconds: 60 // it doesn't matter, as this is an implementation detail for the underlying cache
          }
        })
        const result = await getFromLayeredCache({
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
          const getFromLayeredCache = layeredCacheFactory<string>({
            inMemoryCache: mockInMemoryCache,
            distributedCache: undefined,
            retrieveFromSource: async () => 'fromSource',
            options: {
              inMemoryExpiryTimeSeconds: 2, // it doesn't matter, as this is an implementation detail for the underlying cache
              redisExpiryTimeSeconds: 60 // it doesn't matter, as this is an implementation detail for the underlying cache
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
          const getFromLayeredCache = layeredCacheFactory<string>({
            inMemoryCache: mockInMemoryCache,
            distributedCache: undefined,
            retrieveFromSource: async () => 'fromSource',
            options: {
              inMemoryExpiryTimeSeconds: 2, // it doesn't matter, as this is an implementation detail for the underlying cache
              redisExpiryTimeSeconds: 60 // it doesn't matter, as this is an implementation detail for the underlying cache
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
  describe('with both in-memory and distributed cache', () => {
    describe('bust cache is enabled', () => {
      it('should return from source and not hit the in-memory or distributed cache. It should then update both caches.', async () => {
        const key = cryptoRandomString({ length: 10 })
        const mockInMemoryCache: InMemoryCache<string> = {
          get: () => {
            expect(true, 'Should not be hitting the in-memory cache').to.equal(false)
            return 'fromInMemory'
          },
          set: (keyToSet: string, value: string) => {
            expect(keyToSet).to.equal(key)
            expect(value).to.equal('fromSource')
          }
        }
        const mockDistributedCache: Pick<Redis, 'get' | 'setex'> = {
          get: (): Promise<string | null> => {
            expect(true, 'Should not be hitting the distributed cache').to.equal(false)
            return Promise.resolve(null)
          },
          setex: (keyToSet: string, seconds: number, value: string): Promise<'OK'> => {
            expect(keyToSet).to.equal(key)
            expect(value).to.equal(JSON.stringify('fromSource'))
            expect(seconds).to.equal(60)
            return Promise.resolve('OK')
          }
        }
        const getFromLayeredCache = layeredCacheFactory<string>({
          inMemoryCache: mockInMemoryCache,
          distributedCache: mockDistributedCache,
          retrieveFromSource: async () => 'fromSource',
          options: {
            inMemoryExpiryTimeSeconds: 2, // it doesn't matter, as this is an implementation detail for the underlying cache
            redisExpiryTimeSeconds: 60 // it doesn't matter, as this is an implementation detail for the underlying cache
          }
        })
        const result = await getFromLayeredCache({
          key,
          bustCache: true
        })
        expect(result).to.equal('fromSource')
      })
    })
    describe('bust cache is disabled', () => {
      describe('the key exists in the in-memory cache but does not exist in the distributed cache', () => {
        //NB we don't test if the key has expired or not, as this is an implementation detail for the underlying cache
        it('should return from the in-memory cache, should not hit the distributed cache or source, and no caches should be updated', async () => {
          const key = cryptoRandomString({ length: 10 })
          const mockInMemoryCache: InMemoryCache<string> = {
            get: () => {
              return 'fromInMemory'
            },
            set: () => {
              expect(true, 'cache should not be updated').to.equal(false)
            }
          }
          const mockDistributedCache: Pick<Redis, 'get' | 'setex'> = {
            get: (): Promise<string | null> => {
              expect(true, 'Should not be hitting the distributed cache').to.equal(
                false
              )
              return Promise.resolve(null)
            },
            setex: (): Promise<'OK'> => {
              expect(true, 'Should not be updating the distributed cache').to.equal(
                false
              )
              return Promise.resolve('OK')
            }
          }
          const getFromLayeredCache = layeredCacheFactory<string>({
            inMemoryCache: mockInMemoryCache,
            distributedCache: mockDistributedCache,
            retrieveFromSource: async () => 'fromSource',
            options: {
              inMemoryExpiryTimeSeconds: 2, // it doesn't matter, as this is an implementation detail for the underlying cache
              redisExpiryTimeSeconds: 60 // it doesn't matter, as this is an implementation detail for the underlying cache
            }
          })
          const result = await getFromLayeredCache({
            key,
            bustCache: false
          })
          expect(result).to.equal('fromInMemory')
        })
      })
      describe('the key does not exist in the in-memory cache but exists in the distributed cache', () => {
        //NB we don't test if the key has expired or not, as this is an implementation detail for the underlying cache
        it('should return from the distributed cache and update the in-memory cache with new value', async () => {
          const key = cryptoRandomString({ length: 10 })
          const mockInMemoryCache: InMemoryCache<string> = {
            get: () => {
              return undefined
            },
            set: (keyToSet: string, value: string) => {
              expect(keyToSet).to.equal(key)
              expect(value).to.equal('fromDistributed')
            }
          }
          const mockDistributedCache: Pick<Redis, 'get' | 'setex'> = {
            get: (): Promise<string | null> => {
              return Promise.resolve(JSON.stringify('fromDistributed'))
            },
            setex: (): Promise<'OK'> => {
              expect(true, 'Should not be updating the distributed cache').to.equal(
                false
              )
              return Promise.resolve('OK')
            }
          }
          const getFromLayeredCache = layeredCacheFactory<string>({
            inMemoryCache: mockInMemoryCache,
            distributedCache: mockDistributedCache,
            retrieveFromSource: async () => 'fromSource',
            options: {
              inMemoryExpiryTimeSeconds: 2, // it doesn't matter, as this is an implementation detail for the underlying cache
              redisExpiryTimeSeconds: 60 // it doesn't matter, as this is an implementation detail for the underlying cache
            }
          })
          const result = await getFromLayeredCache({
            key,
            bustCache: false
          })
          expect(result).to.equal('fromDistributed')
        })
      })
      describe('the key misses both caches', () => {
        it('should return from source and update both caches with new value', async () => {
          const key = cryptoRandomString({ length: 10 })
          const mockInMemoryCache: InMemoryCache<string> & {
            setMemory: Record<string, string>
          } = {
            setMemory: {},
            get: () => {
              return undefined
            },
            set: (keyToSet: string, value: string) => {
              expect(keyToSet).to.equal(key)
              expect(value).to.equal('fromSource')
              mockInMemoryCache.setMemory[keyToSet] = value
            }
          }
          const mockDistributedCache: Pick<Redis, 'get' | 'setex'> & {
            setMemory: Record<string, string>
          } = {
            setMemory: {},
            get: (): Promise<string | null> => {
              return Promise.resolve(null)
            },
            setex: (
              keyToSet: string,
              seconds: number,
              value: string
            ): Promise<'OK'> => {
              expect(keyToSet).to.equal(key)
              expect(value).to.equal(JSON.stringify('fromSource'))
              expect(seconds).to.equal(60)
              return Promise.resolve('OK')
            }
          }
          const getFromLayeredCache = layeredCacheFactory<string>({
            inMemoryCache: mockInMemoryCache,
            distributedCache: mockDistributedCache,
            retrieveFromSource: async () => 'fromSource',
            options: {
              inMemoryExpiryTimeSeconds: 2, // it doesn't matter, as this is an implementation detail for the underlying cache
              redisExpiryTimeSeconds: 60 // it doesn't matter, as this is an implementation detail for the underlying cache
            }
          })
          const result = await getFromLayeredCache({
            key,
            bustCache: false
          })
          expect(result).to.equal('fromSource')
          expect(mockInMemoryCache.setMemory[key]).to.equal('fromSource')
        })
      })
    })
  })
})
