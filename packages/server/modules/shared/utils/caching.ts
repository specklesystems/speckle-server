/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Factory } from '@/modules/shared/helpers/factory'
import { getGenericRedis } from '@/modules/shared/redis/redis'
import { getRequestLogger } from '@/observability/utils/requestContext'
import { cacheLogger } from '@/observability/logging'
import TTLCache from '@isaacs/ttlcache'
import type { MaybeAsync } from '@speckle/shared'
import { TIME_MS } from '@speckle/shared'
import type Redis from 'ioredis'
import { isNumber } from 'lodash-es'

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
    /**
     * Whether to always return the same promise instead of creating a new one for each call when the args are the same.
     * This will avoid multiple calls to the resolver function on empty cache when they're invoked in short succession - the 2nd call
     * will just await the 1st call's promise.
     * Default: true
     */
    cachePromises?: boolean
    /**
     * Logger log level. Defaults to 'debug'
     */
    logLevel?: 'info' | 'debug'
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
  const cacheProvider = params.cacheProvider
  const { name, resolver, options } = params
  const cachePromises = params.options?.cachePromises ?? true
  const { argsKey = (...args: Args) => JSON.stringify(args) } = options || {}
  const key = (...args: Args) => `wrapWithCache:${name}:${argsKey(...args)}`
  const logLevel = options?.logLevel || 'debug'

  const buildResolver =
    (
      retOptions?: Partial<{
        skipCache: boolean
      }>
    ) =>
    async (...args: Args) => {
      const { skipCache } = retOptions || {}

      const ttlMs = isNumber(params.ttlMs) ? params.ttlMs : params.ttlMs(...args)
      const cacheKey = key(...args)
      const logger = (getRequestLogger() || cacheLogger).child({
        cacheName: name
      })

      if (skipCache) {
        logger[logLevel]("Cache '{cacheName}' skipped for specific args")
      } else {
        const cached = await cacheProvider.get(cacheKey)
        if (cached !== undefined) {
          logger[logLevel]("Cache '{cacheName}' hit for specific args")
          return cached as Results
        } else {
          logger[logLevel]("Cache '{cacheName}' miss for specific args")
        }
      }

      const result = await resolver(...args)
      await cacheProvider.set(cacheKey, result, { ttlMs })
      logger[logLevel]("Cache '{cacheName}' upserted for specific args")

      return result
    }

  const coreResolver = buildResolver()
  const freshResolver = buildResolver({ skipCache: true })

  const promiseCache = new Map<string, Promise<Results>>()
  const mainResolver = cachePromises
    ? async (...args: Args) => {
        const cacheKey = key(...args)
        if (promiseCache.has(cacheKey)) {
          return promiseCache.get(cacheKey)!
        }

        const resolverPromise = coreResolver(...args).finally(() => {
          promiseCache.delete(cacheKey)
        })

        promiseCache.set(cacheKey, resolverPromise)
        return resolverPromise
      }
    : coreResolver

  const ret = mainResolver as {
    (...args: Args): Promise<Results>
    /**
     * Delete cached data for the given args
     */
    clear: (...args: Args) => Promise<void>
    /**
     * Get fresh results irregardless of cached data
     */
    fresh: (...args: Args) => Promise<Results>
  }

  ret.clear = async (...args: Args) => {
    const cacheKey = key(...args)
    const logger = (getRequestLogger() || cacheLogger).child({ cacheName: name })

    await cacheProvider.delete(cacheKey)
    logger[logLevel]("Cache '{cacheName}' cleared for specific args")
  }

  ret.fresh = freshResolver

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
    deps: Deps & {
      /**
       * Optionally inject custom cacheProvider
       */
      cacheProvider?: CacheProvider<any>
    },
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
    const cacheProvider = deps.cacheProvider || params.cacheProvider

    return wrapWithCache({
      ...rest,
      name,
      cacheProvider,
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
        Math.floor(ttlMs / TIME_MS.second) // convert milliseconds to seconds
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

export const appConstantValueCache = new TTLCache<string, unknown>()

/**
 * Use this for roles, scopes and other constant values that are not supposed to change during the app's lifetime.
 * This cache gets cleared right after the app starts, to ensure up to date values (roles, scopes et.c)
 */
export const appConstantValueCacheProviderFactory = () =>
  inMemoryCacheProviderFactory({ cache: appConstantValueCache })
