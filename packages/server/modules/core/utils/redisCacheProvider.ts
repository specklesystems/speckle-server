import type { Redis } from 'ioredis'
import { CacheProvider } from '@/modules/core/utils/cacheHandler'

export const redisCacheFactory = <T>(deps: {
  redis: Redis
  options: { ttlMilliseconds: number }
}): CacheProvider<T> => {
  const { redis } = deps
  return {
    get: async (key: string) => {
      const result = await redis.get(key)
      return result ? (JSON.parse(result) as T) : undefined
    },
    set: async (key: string, value: T) => {
      await redis.set(
        key,
        JSON.stringify(value),
        'EX',
        Math.floor(deps.options.ttlMilliseconds / 1000) // convert milliseconds to seconds
      )
    }
  }
}
