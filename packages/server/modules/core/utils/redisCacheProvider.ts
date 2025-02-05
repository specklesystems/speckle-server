import type { Redis } from 'ioredis'
import { CacheProvider } from '@/modules/core/utils/cacheHandler'
import { Logger } from 'pino'
import { maybeLoggerWithContext } from '@/logging/requestContext'

export const redisCacheFactory = <T>(deps: {
  redis: Redis
  options: { ttlMilliseconds: number; logger?: Logger }
}): CacheProvider<T> => {
  const { redis } = deps
  return {
    get: async (key: string) => {
      const result = await redis.get(key)
      const reqLogger = maybeLoggerWithContext({ logger: deps.options.logger })
      if (result) {
        reqLogger?.info(`Cache hit for key: '${key}'`)
        return JSON.parse(result) as T
      }

      reqLogger?.info(`Cache miss for key: '${key}'`)
      return undefined
    },
    set: async (key: string, value: T) => {
      const reqLogger = maybeLoggerWithContext({ logger: deps.options.logger })
      const ttl = Math.floor(deps.options.ttlMilliseconds / 1000) // convert milliseconds to seconds
      reqLogger?.info(`Upserting cache for key: '${key}' with ttl: ${ttl}s`)
      await redis.set(key, JSON.stringify(value), 'EX', ttl)
    }
  }
}
