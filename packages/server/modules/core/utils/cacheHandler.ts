import { maybeLoggerWithContext } from '@/logging/requestContext'
import { Logger } from 'pino'

export interface CacheProvider<T> {
  get: (key: string) => Promise<T | undefined>
  set: (key: string, value: T) => Promise<void>
}

export type RetrieveFromCache<T> = (params: {
  key: string
  bustCache?: boolean
}) => Promise<T>

/**
 * Responsible for handling the retrieval of a value from a cache or, if no cache or no cache hit, from the source callback.
 */
export const retrieveViaCacheFactory = <T>(deps: {
  retrieveFromSource: (key: string) => Promise<T>
  cache: CacheProvider<T>
  options: {
    prefix: string
    logger: Logger
  }
}): RetrieveFromCache<T> => {
  const { options, retrieveFromSource, cache } = deps
  const reqLogger = maybeLoggerWithContext({ logger: deps.options.logger })
  return async (params) => {
    const { key, bustCache } = params

    const cacheKey = `${options.prefix}:${key}`

    if (!bustCache) {
      const cacheResult = await cache.get(cacheKey)
      if (cacheResult !== undefined) {
        reqLogger?.info(
          { cachePrefix: options.prefix },
          "Cache hit for key with prefix '{cachePrefix}'" // we don't want to log the key, as it could be sensitive e.g. a token.
        )
        return cacheResult
      } else {
        reqLogger?.info(
          { cachePrefix: options.prefix },
          "Cache miss for key with prefix '{cachePrefix}'" // we don't want to log the key, as it could be sensitive e.g. a token.
        )
      }
    }

    // if cache is to be busted or if there is no cache hit, we will retrieve from source and then update the cache
    const result = await retrieveFromSource(key)
    reqLogger?.info(
      { cachePrefix: options.prefix },
      "Upserting cache for key with prefix '{cachePrefix}'" // we don't want to log the key, as it could be sensitive e.g. a token.
    )
    await cache.set(cacheKey, result)

    return result
  }
}
