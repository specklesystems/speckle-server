import type { Optional } from '@speckle/shared'
import { has as objectHas } from 'lodash-es'

/**
 * Cache utility that is available for the lifetime of the entire server process or the tab session on the client-side
 * The cache itself is a basic in memory object, but could be swapped out to redis in SSR
 */

const cache: Record<string, unknown> = {}

export default defineNuxtPlugin((nuxtApp) => {
  const reqTouched: Record<string, boolean> = {}

  if (process.server) {
    nuxtApp.hook('app:rendered', () => {
      const cacheToSend = Object.keys(reqTouched).reduce((acc, key) => {
        acc[key] = cache[key]
        return acc
      }, {} as Record<string, unknown>)
      nuxtApp.ssrContext!.payload.appCache = cacheToSend
    })
  } else if (process.client) {
    const restorable = window.__NUXT__?.appCache as Optional<Record<string, unknown>>
    if (restorable) {
      Object.assign(cache, restorable)
    }
  }

  const has = (key: string): boolean => objectHas(cache, key)

  const set = <V>(
    key: string,
    val: V,
    options?: Partial<{
      /**
       * Time in milliseconds after which the cache entry will be removed
       */
      expiryMs: number
    }>
  ) => {
    cache[key] = val
    reqTouched[key] = true

    if (options?.expiryMs) {
      setTimeout(() => {
        delete cache[key]
      }, options.expiryMs)
    }
  }

  const get = <V = unknown>(key: string): V | undefined => {
    if (!has(key)) return undefined

    const val = cache[key] as V
    reqTouched[key] = true
    return val
  }

  return {
    provide: {
      appCache: { has, set, get }
    }
  }
})
