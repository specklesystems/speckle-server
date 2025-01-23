import type { Redis } from 'ioredis'
import { CacheProvider } from '@/modules/core/utils/cacheHandler'

export const redisCacheFactory = <T>(deps: { redis: Redis }): CacheProvider<T> => {
  const { redis } = deps
  return {
    get: async (key: string) => {
      const result = await redis.get(key)
      return result ? (JSON.parse(result) as T) : undefined
    },
    set: async (key: string, value: T, options: { ttlMilliseconds: number }) => {
      await redis.set(
        key,
        JSON.stringify(value),
        'EX',
        Math.floor(options.ttlMilliseconds / 1000) // convert milliseconds to seconds
      )
    }
  }
}
