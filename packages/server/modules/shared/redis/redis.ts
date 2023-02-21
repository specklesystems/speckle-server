import { redisLogger } from '@/logging/logging'
import Redis, { RedisOptions } from 'ioredis'
import sentry from '@/logging/sentryHelper'
import {
  EnvironmentResourceError,
  MisconfiguredEnvironmentError
} from '@/modules/shared/errors'

export function createRedisClient(redisUrl: string, redisOptions: RedisOptions): Redis {
  let redisClient: Redis
  try {
    redisClient = new Redis(redisUrl, redisOptions)
    redisClient.on('error', (err) => {
      redisLogger.error(err, 'Redis encountered an error.')
      if (err instanceof Error) {
        throw new EnvironmentResourceError('Redis encountered an error.', err) //FIXME backoff and retry?
      }
      throw new EnvironmentResourceError('Redis encountered an error.') //FIXME backoff and retry?
    })
  } catch (err) {
    redisLogger.error(err, 'Could not create Redis client')
    sentry({ err, kind: null, extras: null })
    if (err instanceof Error) {
      throw new MisconfiguredEnvironmentError('Unable to connect to Redis.', err) //FIXME backoff and retry?
    }
    throw new MisconfiguredEnvironmentError('Unable to connect to Redis.') //FIXME backoff and retry?
  }

  return redisClient
}
