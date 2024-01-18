import type { MaybeAsync } from '@speckle/shared'

/**
 * In SSR: Provides a redis cache that is shared across app processes and requests
 * In CSR: Provides an in-memory cache that is shared across the app session
 */
export function useAppCache() {
  const app = useNuxtApp()
  return app.$appCache
}

/**
 * Get value from app cache or resolve and set it
 */
export async function useAppCached<V = unknown>(
  key: string,
  resolver: () => MaybeAsync<V>,
  options?: Parameters<ReturnType<typeof useAppCache>['set']>['2']
): Promise<V> {
  const cache = useAppCache()
  if (await cache.has(key)) {
    return (await cache.get(key)) as V
  }

  const data = await Promise.resolve(resolver())
  await cache.set(key, data, options)
  return data
}
