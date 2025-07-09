import type { CheckResponse, RedisCheck } from '@/healthchecks/types'
import { isRedisReady } from '@speckle/shared/redis'

export const isRedisAlive: RedisCheck = async (params): Promise<CheckResponse> => {
  const { client } = params
  await isRedisReady(client)

  let result: CheckResponse = { isAlive: true }
  try {
    const redisResponse = await client.ping()
    if (redisResponse !== 'PONG') {
      throw new Error('Redis did not respond correctly.')
    }
  } catch (err) {
    result = { isAlive: false, err }
  } finally {
    return result
  }
}
