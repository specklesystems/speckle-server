/**
 * Responsible for handling the retrieval of a value from source, and caching in both in-memory and distributed cache.
 */

import type { Redis } from 'ioredis'
import { InMemoryCache, RetrieveFromCache } from '@/modules/core/utils/cacheHandler'

export const layeredCacheFactory = <T>(deps: {
  retrieveFromSource: () => Promise<T>
  inMemoryCache: InMemoryCache<T>
  distributedCache?: Pick<Redis, 'get' | 'setex'>
  options?: {
    inMemoryExpiryTimeSeconds?: number
    redisExpiryTimeSeconds?: number
  }
}): RetrieveFromCache<T> => {
  const { options, retrieveFromSource, inMemoryCache, distributedCache } = deps
  const inMemoryTtl = (options?.inMemoryExpiryTimeSeconds || 2) * 1000 // convert seconds to milliseconds

  return async (params) => {
    const { key, bustCache } = params

    if (!bustCache) {
      const inMemoryResult = inMemoryCache.get(key)
      if (inMemoryResult !== undefined) return inMemoryResult

      if (distributedCache) {
        const cachedResult = await distributedCache.get(key)
        if (cachedResult) {
          const parsedCachedResult = JSON.parse(cachedResult) as T

          // update inMemoryCache with the result from distributedCache. Prevents us hitting Redis too often.
          inMemoryCache.set(key, parsedCachedResult, {
            ttl: inMemoryTtl
          })
          return parsedCachedResult
        }
      }
    }
    // if cache is to be busted, we will retrieve from source and then update the cache

    const result = await retrieveFromSource()

    // update both layers of cache with whatever we got from the source
    inMemoryCache.set(key, result, {
      ttl: inMemoryTtl
    })
    if (distributedCache) {
      await distributedCache.setex(
        key,
        options?.redisExpiryTimeSeconds || 60,
        JSON.stringify(result)
      )
    }

    return result
  }
}
