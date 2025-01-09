import TTLCache from '@isaacs/ttlcache'
import type { Redis } from 'ioredis'

export type GetFromLayeredCache<T> = (params: {
  retrieveFromSource: () => Promise<T | undefined>
  key: string
  inMemoryCache: TTLCache<string, T>
  distributedCache?: Redis
  bustCache?: boolean
}) => Promise<T | undefined>

export const layeredCacheFactory = <T>(deps: {
  options?: {
    inMemoryExpiryTimeSeconds?: number
    redisExpiryTimeSeconds?: number
  }
}): GetFromLayeredCache<T> => {
  const { options } = deps

  return async (params) => {
    const { key, retrieveFromSource, inMemoryCache, distributedCache, bustCache } =
      params

    if (!bustCache) {
      const inMemoryResult = inMemoryCache.get(key)
      if (inMemoryResult) return inMemoryResult
    } else {
      //bustCache
      inMemoryCache.delete(key)
    }

    if (distributedCache) {
      if (!bustCache) {
        const cachedResult = await distributedCache.get(key)
        if (cachedResult) {
          const parsedCachedResult = JSON.parse(cachedResult) as T

          // update inMemoryCache with the result from distributedCache. Prevents us hitting Redis too often.
          inMemoryCache.set(key, parsedCachedResult, {
            ttl: (options?.inMemoryExpiryTimeSeconds || 2) * 1000 // convert seconds to milliseconds
          })
          return parsedCachedResult
        }
      } else {
        //bustCache
        await distributedCache.del(key)
      }
    }
    const result = await retrieveFromSource()

    if (result) {
      inMemoryCache.set(key, result, {
        ttl: (options?.inMemoryExpiryTimeSeconds || 2) * 1000 // convert seconds to milliseconds
      })
      if (distributedCache) {
        await distributedCache.setex(
          key,
          options?.redisExpiryTimeSeconds || 60,
          JSON.stringify(result)
        )
      }
    }

    return result
  }
}
