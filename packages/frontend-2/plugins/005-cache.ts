/* eslint-disable @typescript-eslint/require-await */

import type { Optional } from '@speckle/shared'
import { has as objectHas } from 'lodash-es'
import type { Redis } from 'ioredis'
import type { AppLogger } from '~/composables/logging'

type AsyncCacheInterface = {
  has(key: string): Promise<boolean>
  get<V = unknown>(key: string): Promise<V | undefined>
  set<V = unknown>(key: string, val: V, options?: { expiryMs: number }): Promise<void>
  setMultiple<V = unknown>(
    keyVals: Record<string, V>,
    options?: { expiryMs: number }
  ): Promise<void>
  getMultiple(keys: string[]): Promise<Record<string, unknown>>
}

const createInMemoryCache = () => {
  const cache: Record<string, unknown> = {}

  const res: AsyncCacheInterface = {
    has: async (key) => objectHas(cache, key),
    set: async (key, val, options) => {
      cache[key] = val

      if (options?.expiryMs) {
        setTimeout(() => {
          delete cache[key]
        }, options.expiryMs)
      }
    },
    get: async <V = unknown>(key: string) => {
      if (!objectHas(cache, key)) return undefined

      const val = cache[key] as V
      return val
    },
    setMultiple: async (keyVals, options) => {
      Object.assign(cache, keyVals)

      if (options?.expiryMs) {
        setTimeout(() => {
          for (const key of Object.keys(keyVals)) {
            delete cache[key]
          }
        }, options.expiryMs)
      }
    },
    getMultiple: async (keys) => {
      const keyVals = {} as Record<string, unknown>
      for (const key of keys) {
        if (!objectHas(cache, key)) continue

        keyVals[key] = cache[key]
      }

      return keyVals
    }
  }

  return res
}

const inMemoryCache = createInMemoryCache()

const getOrInitInternalCache = async (params: {
  redis: Optional<Redis>
  logger: AppLogger
}) => {
  const { logger, redis } = params

  if (!redis) {
    logger.info(
      'Initializing appCache as basic in-memory cache (no redis available)...'
    )
    return inMemoryCache
  }

  logger.info('Initializing appCache with redis...')
  const client = redis
  const redisKeyPrefix = 'fe2-app-cache:'
  const finalKey = (key: string) => redisKeyPrefix + key

  const internalCache: AsyncCacheInterface = {
    has: async (key) => {
      const exists = await client.exists(finalKey(key))
      return !!exists
    },
    set: async (key, val, options) => {
      if (options?.expiryMs) {
        await client.set(finalKey(key), JSON.stringify(val), 'PX', options.expiryMs)
      } else {
        await client.set(finalKey(key), JSON.stringify(val))
      }
    },
    get: async <V = unknown>(key: string) => {
      const val = await client.get(finalKey(key))
      if (!val) return undefined

      return JSON.parse(val) as V
    },
    setMultiple: async (keyVals, options) => {
      const entries = Object.entries(keyVals).map(([key, val]) => [
        finalKey(key),
        JSON.stringify(val)
      ])

      if (options?.expiryMs) {
        await client.mset(...entries.flat(), 'PX', options.expiryMs)
      } else {
        await client.mset(...entries.flat())
      }
    },
    getMultiple: async (keys) => {
      if (!keys?.length) return {}

      const finalKeys = keys.map(finalKey)
      const vals = await client.mget(...finalKeys)
      const keyVals = {} as Record<string, unknown>
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        const val = vals[i]
        if (!val) continue

        keyVals[key] = JSON.parse(val)
      }

      return keyVals
    }
  }

  return internalCache
}

/**
 * In SSR: Provides a redis cache that is shared across app processes and requests
 * In CSR: Provides an in-memory cache that is shared across the app session
 */
export default defineNuxtPlugin(async (nuxtApp) => {
  const logger = useLogger()
  const internalCache = await getOrInitInternalCache({
    redis: nuxtApp.$redis as Redis,
    logger
  })
  const reqTouched: Record<string, boolean> = {}

  if (import.meta.server) {
    nuxtApp.hook('app:rendered', async () => {
      const touchedKeys = Object.keys(reqTouched)
      const cacheToSend = await internalCache.getMultiple(touchedKeys)

      nuxtApp.ssrContext!.payload.appCache = cacheToSend
    })
  } else if (import.meta.client) {
    const restorable = window.__NUXT__?.appCache as Optional<Record<string, unknown>>
    if (restorable) {
      await internalCache.setMultiple(restorable)
    }
  }

  const finalCache: AsyncCacheInterface = {
    has: async (key) => {
      const has = await internalCache.has(key)
      return has
    },
    set: async (key, val, options) => {
      await internalCache.set(key, val, options)
      reqTouched[key] = true
    },
    get: async <V = unknown>(key: string) => {
      const val = await internalCache.get<V>(key)
      reqTouched[key] = true
      return val
    },
    setMultiple: async (keyVals, options) => {
      await internalCache.setMultiple(keyVals, options)
      for (const key of Object.keys(keyVals)) {
        reqTouched[key] = true
      }
    },
    getMultiple: async (keys) => {
      const keyVals = await internalCache.getMultiple(keys)
      for (const key of keys) {
        reqTouched[key] = true
      }
      return keyVals
    }
  }

  return {
    provide: {
      appCache: finalCache
    }
  }
})
