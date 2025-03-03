/* eslint-disable @typescript-eslint/no-explicit-any */
import { Factory } from '@/modules/shared/helpers/factory'
import { getGenericRedis } from '@/modules/shared/redis/redis'
import { getRequestLogger } from '@/observability/components/express/requestContext'
import { cacheLogger } from '@/observability/logging'
import TTLCache from '@isaacs/ttlcache'
import { MaybeAsync } from '@speckle/shared'
import Redis from 'ioredis'
import { isNumber } from 'lodash'

export interface CacheProvider<Data = unknown> {
  get: (key: string) => Promise<Data | undefined>
  set: (
    key: string,
    value: Data,
    options: {
      /**
       * TTL for the cache in milliseconds
       */
      ttlMs: number
    }
  ) => Promise<void>
  delete: (key: string) => Promise<void>
}

type WrapWithCacheBaseParams<Args extends Array<any>> = {
  /**
   * Globally unique name for this cache function. Used to build the key
   */
  name: string
  /**
   * Cache provider to use for the actual caching
   */
  cacheProvider: CacheProvider<any>
  /**
   * TTL for the cache in milliseconds
   */
  ttlMs: number | ((...args: Args) => number)
  /**
   * Optional settings
   */
  options?: Partial<{
    /**
     * Function to generate the cache key for the specific args. Defaults to JSON.stringify
     */
    argsKey: (...args: Args) => string
  }>
}

export const wrapWithCache = <Args extends Array<any>, Results>(
  params: WrapWithCacheBaseParams<Args> & {
    /**
     * Function for resolving initial data, when nothing has been cached yet
     */
    resolver: (...args: Args) => MaybeAsync<Results>
  }
) => {
  let cacheProvider = params.cacheProvider
  const { name, resolver, options } = params
  const { argsKey = (...args: Args) => JSON.stringify(args) } = options || {}
  const key = (...args: Args) => `wrapWithCache:${name}:${argsKey(...args)}`

  const buildRet =
    (
      retOptions?: Partial<{
        skipCache: boolean
      }>
    ) =>
    async (...args: Args) => {
      const { skipCache } = retOptions || {}

      const ttlMs = isNumber(params.ttlMs) ? params.ttlMs : params.ttlMs(...args)
      const cacheKey = key(...args)
      const logger = (getRequestLogger() || cacheLogger).child({ cacheName: name })

      if (skipCache) {
        logger.info("Cache '{cacheName}' skipped for specific args")
      } else {
        const cached = await cacheProvider.get(cacheKey)
        if (cached !== undefined) {
          logger.info("Cache '{cacheName}' hit for specific args")
          return cached as Results
        } else {
          logger.info("Cache '{cacheName}' miss for specific args")
        }
      }

      const result = await resolver(...args)
      await cacheProvider.set(cacheKey, result, { ttlMs })
      logger.info("Cache '{cacheName}' upserted for specific args")

      return result
    }

  const ret = buildRet() as {
    (...args: Args): Promise<Results>
    /**
     * Delete cached data for the given args
     */
    clear: (...args: Args) => Promise<void>
    /**
     * Get fresh results irregardless of cached data
     */
    fresh: (...args: Args) => Promise<Results>

    /**
     * Replace the cache provider with a new one. Primarily used in testing to replace w/ mocked providers.
     */
    replaceCache: (cacheProvider: CacheProvider<any>) => void
  }

  ret.clear = async (...args: Args) => {
    const cacheKey = key(...args)
    const logger = (getRequestLogger() || cacheLogger).child({ cacheName: name })

    await cacheProvider.delete(cacheKey)
    logger.info("Cache '{cacheName}' cleared for specific args")
  }

  ret.fresh = buildRet({ skipCache: true })

  ret.replaceCache = (newCacheProvider) => {
    cacheProvider = newCacheProvider
  }

  return ret
}

export const wrapFactoryWithCache = <
  Deps extends object,
  Args extends Array<any>,
  Results
>(
  params: WrapWithCacheBaseParams<Args> & {
    /**
     * Factory function to generate the data resolver
     */
    factory: Factory<Deps, Args, MaybeAsync<Results>>
  }
) => {
  return (
    deps: Deps,
    options?: Partial<{
      /**
       * The same factory with different kinds of injected deps might require different cache keys.
       * Use this key to differentiate between them
       */
      cacheKey: string
    }>
  ) => {
    const { factory, ...rest } = params
    const name = options?.cacheKey ? `${params.name}:${options.cacheKey}` : params.name
    return wrapWithCache({
      ...rest,
      name,
      resolver: factory(deps)
    })
  }
}

export const redisCacheProviderFactory = (deps?: {
  redis?: Redis
}): CacheProvider<unknown> => {
  const redis = deps?.redis || getGenericRedis()
  return {
    get: async (key) => {
      const result = await redis.get(key)
      return result ? (JSON.parse(result) as unknown) : undefined
    },
    set: async (key, value, { ttlMs }) => {
      await redis.set(
        key,
        JSON.stringify(value),
        'EX',
        Math.floor(ttlMs / 1000) // convert milliseconds to seconds
      )
    },
    delete: async (key) => {
      await redis.del(key)
    }
  }
}

const genericTtlCache = new TTLCache<string, unknown>()

export const inMemoryCacheProviderFactory = (deps?: {
  cache?: InstanceType<typeof TTLCache<string, unknown>>
}): CacheProvider<unknown> => {
  const cache = deps?.cache || genericTtlCache
  return {
    get: async (key) => cache.get(key),
    set: async (key, value, { ttlMs }) => {
      cache.set(key, value, { ttl: ttlMs })
    },
    delete: async (key) => {
      cache.delete(key)
    }
  }
}
