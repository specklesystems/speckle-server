import { TokenValidationResult } from '@/modules/core/helpers/types'
import { TokenId } from '@/modules/core/services/tokens'
import { getRedisUrl } from '@/modules/shared/helpers/envHelper'
import { createRedisClient } from '@/modules/shared/redis/redis'

const keyPrefix = 'authContext:'

const determineKey = (token: TokenId) => `${keyPrefix}${token}`

const redisOptions = {
  enableReadyCheck: false,
  maxRetriesPerRequest: null
}

export async function tryGetTokenValidationResultFromCache(
  token: TokenId
): Promise<TokenValidationResult | null> {
  const redisClient = createRedisClient(getRedisUrl(), redisOptions) //FIXME is this expensive or should we cache the redis client?

  try {
    const result = await redisClient.get(determineKey(token))
    if (!result || typeof result !== 'string') {
      return null
    }

    //TODO zod parse and validate?
    return JSON.parse(result)
  } catch (err) {
    // do nothing
  }

  return null
}

export async function setTokenValidationResultInCache(
  token: TokenId,
  tokenValidationResult: TokenValidationResult,
  seconds: number
): Promise<boolean> {
  const redisClient = createRedisClient(getRedisUrl(), redisOptions) //FIXME is this expensive or should we cache the redis client?
  try {
    const OK = await redisClient.set(
      determineKey(token),
      JSON.stringify(tokenValidationResult),
      'EX',
      seconds
    )
    if (OK === 'OK') {
      return true
    }
  } catch (err) {
    // do nothing
  }

  return false
}

export async function removeTokenValidationResultFromCache(
  token: TokenId
): Promise<boolean> {
  const redisClient = createRedisClient(getRedisUrl(), redisOptions) //FIXME is this expensive or should we cache the redis client?
  try {
    const delCount = await redisClient.del(determineKey(token))
    if (delCount > 0) {
      return true
    }
  } catch (err) {
    // do nothing
  }

  return false
}
