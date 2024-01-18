import type { MaybeAsync } from '@speckle/shared'

/**
 * Cache utility that is available for the lifetime of the entire server process (so - across requests)
 * or the full app session on the client-side
 */
export function useAppCache() {
  const app = useNuxtApp()
  return app.$appCache
}

export async function useAppCached<V = unknown>(
  key: string,
  resolver: () => MaybeAsync<V>,
  options?: Parameters<ReturnType<typeof useAppCache>['set']>['2']
): Promise<V> {
  const cache = useAppCache()
  if (cache.has(key)) {
    return cache.get(key) as V
  }

  return await Promise.resolve(resolver()).then((val) => {
    cache.set(key, val, options)
    return val
  })
}
