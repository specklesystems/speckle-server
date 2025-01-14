export interface InMemoryCache<T> {
  get: (key: string) => T | undefined
  set: (key: string, value: T, options: { ttl: number }) => void
}

export type RetrieveFromCache<T> = (params: {
  key: string
  bustCache?: boolean
}) => Promise<T>

export const retrieveViaCacheFactory = <T>(deps: {
  retrieveFromSource: () => Promise<T>
  inMemoryCache: InMemoryCache<T>
  options?: {
    inMemoryTtlSeconds?: number
  }
}): RetrieveFromCache<T> => {
  const { options, retrieveFromSource, inMemoryCache } = deps
  const inMemoryTtl = (options?.inMemoryTtlSeconds || 2) * 1000 // convert seconds to milliseconds
  return async (params) => {
    const { key, bustCache } = params

    if (!bustCache) {
      const inMemoryResult = inMemoryCache.get(key)
      if (inMemoryResult) return inMemoryResult
    }
    // if cache is to be busted, we will retrieve from source and then update the cache

    const result = await retrieveFromSource()

    // update both layers of cache with whatever we got from the source
    inMemoryCache.set(key, result, {
      ttl: inMemoryTtl
    })

    return result
  }
}
