import { AuthContext } from '@/modules/shared/authz'
import { getRedisUrl } from '@/modules/shared/helpers/envHelper'
import { createRedisClient } from '@/modules/shared/redis/redis'

const keyPrefix = 'authContext:'

const determineKey = (token: string) => `${keyPrefix}${token}`

const redisOptions = {
  enableReadyCheck: false,
  maxRetriesPerRequest: null
}

export async function tryGetAuthContextFromCache(
  token: string
): Promise<AuthContext | null> {
  const redisClient = createRedisClient(getRedisUrl(), redisOptions) //FIXME is this expensive or should we cache the redis client?

  try {
    const result = await redisClient.get(determineKey(token))
    if (!result || typeof result !== 'string') {
      return Promise.resolve(null)
    }

    //TODO zod parse and validate?
    return Promise.resolve<AuthContext>(JSON.parse(result))
  } catch (err) {
    // do nothing
  }

  return Promise.resolve(null)
}

export async function setAuthContextInCache(
  token: string,
  authContext: AuthContext,
  seconds: number
): Promise<boolean> {
  const redisClient = createRedisClient(getRedisUrl(), redisOptions) //FIXME is this expensive or should we cache the redis client?
  try {
    const OK = await redisClient.set(
      determineKey(token),
      JSON.stringify(authContext),
      'EX',
      seconds
    )
    if (OK === 'OK') {
      return Promise.resolve(true)
    }
  } catch (err) {
    // do nothing
  }

  return Promise.resolve(false)
}

export async function removeAuthContextFromCache(token: string): Promise<boolean> {
  const redisClient = createRedisClient(getRedisUrl(), redisOptions) //FIXME is this expensive or should we cache the redis client?
  try {
    const delCount = await redisClient.del(determineKey(token))
    if (delCount > 0) {
      return Promise.resolve(true)
    }
  } catch (err) {
    // do nothing
  }

  return Promise.resolve(false)
}
