export interface CacheProvider<T> {
  get: (key: string) => Promise<T | undefined>
  set: (key: string, value: T, options: { ttlMilliseconds: number }) => Promise<void>
}

export type RetrieveFromCache<T> = (params: {
  key: string
  bustCache?: boolean
}) => Promise<T>

/**
 * Responsible for handling the retrieval of a value from a cache or, if no cache hit, from the source callback and then cache the value.
 */
export const retrieveViaCacheFactory = <T>(deps: {
  retrieveFromSource: (key: string) => Promise<T>
  cache: CacheProvider<T>
  options: {
    prefix: string
    inMemoryTtlSeconds: number
  }
}): RetrieveFromCache<T> => {
  const { options, retrieveFromSource, cache } = deps
  const ttlMilliseconds = options.inMemoryTtlSeconds * 1000
  return async (params) => {
    const { key, bustCache } = params

    const cacheKey = `${options.prefix}:${key}`

    if (!bustCache) {
      const cacheResult = await cache.get(cacheKey)
      if (cacheResult !== undefined) return cacheResult
    }

    // if cache is to be busted or if there is no cache hit, we will retrieve from source and then update the cache
    const result = await retrieveFromSource(key)
    await cache.set(cacheKey, result, { ttlMilliseconds })

    return result
  }
}
