export interface InMemoryCache<T> {
  get: (key: string) => T | undefined
  set: (key: string, value: T, options: { ttl: number }) => void
}

export type RetrieveFromCache<T> = (params: {
  key: string
  bustCache?: boolean
}) => Promise<T>

/**
 * Responsible for handling the retrieval of a value from a cache or, if no cache hit, from the source callback and then caching via an in-memory cache.
 */
export const retrieveViaCacheFactory = <T>(deps: {
  retrieveFromSource: () => Promise<T>
  cache: InMemoryCache<T>
  options?: {
    inMemoryTtlSeconds?: number
  }
}): RetrieveFromCache<T> => {
  const { options, retrieveFromSource, cache } = deps
  const inMemoryTtl = (options?.inMemoryTtlSeconds || 2) * 1000 // convert seconds to milliseconds
  return async (params) => {
    const { key, bustCache } = params

    if (!bustCache) {
      const cacheResult = cache.get(key)
      if (cacheResult !== undefined) return cacheResult
    }

    // if cache is to be busted or if there is no cache hit, we will retrieve from source and then update the cache
    const result = await retrieveFromSource()
    cache.set(key, result, {
      ttl: inMemoryTtl
    })

    return result
  }
}
