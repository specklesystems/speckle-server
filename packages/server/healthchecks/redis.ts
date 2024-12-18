import type { CheckResponse, RedisCheck } from '@/healthchecks/types'

export const isRedisAlive: RedisCheck = async (params): Promise<CheckResponse> => {
  const { client } = params
  let result: CheckResponse = { isAlive: true }
  try {
    const redisResponse = await client.ping()
    if (redisResponse !== 'PONG') {
      result = { isAlive: false, err: new Error('Redis did not respond correctly.') }
    }
  } catch (err) {
    result = { isAlive: false, err }
  } finally {
    return result
  }
}
