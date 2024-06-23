import { Optional } from '@speckle/shared'
import Redis from 'ioredis'
import MockRedis from 'ioredis-mock'

let client: Optional<Redis> = undefined

export function createInmemoryRedisClient(): Redis {
  if (!client) {
    client = new MockRedis() as unknown as Redis
  }

  return client
}
