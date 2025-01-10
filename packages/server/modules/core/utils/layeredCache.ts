import TTLCache from '@isaacs/ttlcache'
import type { Redis } from 'ioredis'

export type GetFromLayeredCache<T> = (params: {
  retrieveFromSource: () => Promise<T>
  key: string
  inMemoryCache: TTLCache<string, T>
  distributedCache?: Redis
  bustCache?: boolean
}) => Promise<T>

export const layeredCacheFactory = <T>(deps: {
  options?: {
    inMemoryExpiryTimeSeconds?: number
    redisExpiryTimeSeconds?: number
  }
}): GetFromLayeredCache<T> => {
  const { options } = deps
  const inMemoryTtl = (options?.inMemoryExpiryTimeSeconds || 2) * 1000 // convert seconds to milliseconds

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
            ttl: inMemoryTtl
          })
          return parsedCachedResult
        }
      } else {
        //bustCache
        await distributedCache.del(key)
      }
    }
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
