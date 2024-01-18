import type { MaybeAsync } from '@speckle/shared'

/**
 * Cache utility that is available for the lifetime of the entire server process (so - across requests)
 * or the full app session on the client-side.
 *
 * If redis is available, SSR cache is shared across pods
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
  if (await cache.has(key)) {
    return (await cache.get(key)) as V
  }

  const data = await Promise.resolve(resolver())
  await cache.set(key, data, options)
  return data
}
