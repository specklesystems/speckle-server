import { AuthContext } from '@/modules/shared/authz'
import { getRedisUrl } from '@/modules/shared/helpers/envHelper'
import { createRedisClient } from '@/modules/shared/redis/redis'

const keyPrefix = 'authContext:'

const determineKey = (token: string) => `${keyPrefix}${token}`

const redisOptions = {
  enableReadyCheck: false,
  maxRetriesPerRequest: null
}

export async function tryGetAuthContextFromCache(token: string): Promise<AuthContext> {
  const redisClient = createRedisClient(getRedisUrl(), redisOptions)

  const result = redisClient.get(determineKey(token))
  if (!result || typeof result !== 'string') {
    return Promise.reject<AuthContext>(null)
  }

  //TODO zod parse and validate
  return Promise.resolve(JSON.parse(result))
}

export async function setAuthContextInCache(
  token: string,
  authContext: AuthContext,
  seconds: number
): Promise<void> {
  const redisClient = createRedisClient(getRedisUrl(), redisOptions)
  redisClient.set(determineKey(token), JSON.stringify(authContext), 'EX', seconds)
}

export async function removeAuthContextFromCache(token: string): Promise<void> {
  const redisClient = createRedisClient(getRedisUrl(), redisOptions)
  const numberOfKeysRemoved = await redisClient.del(determineKey(token))
  if (numberOfKeysRemoved === 0) {
    return Promise.reject()
  }
  return Promise.resolve()
}
