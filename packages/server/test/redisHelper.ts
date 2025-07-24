import { redisCacheProviderFactory } from '@/modules/shared/utils/caching'
import type { Optional } from '@speckle/shared'
import type Redis from 'ioredis'
import MockRedis from 'ioredis-mock'

let client: Optional<Redis> = undefined

const createMockRedis = () => new MockRedis() as unknown as Redis

export function getInmemoryRedisClient(): Redis {
  if (!client) {
    client = createMockRedis()
  }

  return client
}

export const mockRedisCacheProviderFactory = (
  options?: Partial<{ createNewCache: boolean }>
) => {
  const client = options?.createNewCache ? createMockRedis() : getInmemoryRedisClient()
  return redisCacheProviderFactory({ redis: client })
}
