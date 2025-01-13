import type { Redis } from 'ioredis'

export interface InMemoryCache<T> {
  get: (key: string) => T | undefined
  set: (key: string, value: T, options: { ttl: number }) => void
}

export type GetFromLayeredCache<T> = (params: {
  retrieveFromSource: () => Promise<T>
  key: string
  inMemoryCache: InMemoryCache<T>
  distributedCache?: Pick<Redis, 'get' | 'setex'>
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
