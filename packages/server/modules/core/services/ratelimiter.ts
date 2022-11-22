import express from 'express'
import Redis from 'ioredis'
import {
  getRedisUrl,
  isTestEnv,
  getIntFromEnv
} from '@/modules/shared/helpers/envHelper'
import {
  BurstyRateLimiter,
  RateLimiterAbstract,
  RateLimiterMemory,
  RateLimiterRedis,
  RateLimiterRes
} from 'rate-limiter-flexible'
import { TIME } from '@speckle/shared'
import { AuthContext } from '@/modules/shared/authz'
import { BaseError } from '@/modules/shared/errors'
import { getIpFromRequest } from '@/modules/shared/utils/ip'
import { Options } from 'verror'

export class RateLimitError extends BaseError {
  static defaultMessage =
    'You have sent too many requests. You are being rate limited. Please try again later.'
  static code = 'RATE_LIMIT_ERROR'

  action: RateLimitAction
  rateLimitBreached: RateLimitBreached

  constructor(
    action: RateLimitAction,
    rateLimitBreached: RateLimitBreached,
    message?: string | null | undefined,
    options: Options | Error | undefined = undefined
  ) {
    super(message ?? RateLimitError.defaultMessage, options)
    this.action = action
    this.rateLimitBreached = rateLimitBreached
  }
}

// typescript definitions
// type RateLimitAction = string
// type RateLimitSource = string

type BurstyRateLimiterOptions = {
  regularOptions: RateLimits
  burstOptions: RateLimits
}

type RateLimits = {
  limitCount: number
  duration: number
}

enum RateLimitAction {
  // ALL_REQUESTS_BURST = 'ALL_REQUESTS_BURST',
  ALL_REQUESTS = 'ALL_REQUESTS',
  GRAPHQL_REQUESTS = 'GRAPHQL_REQUESTS',
  USER_CREATE = 'USER_CREATE',
  STREAM_CREATE = 'STREAM_CREATE',
  COMMIT_CREATE = 'COMMIT_CREATE',
  'POST /api/getobjects/:streamId' = 'POST /api/getobjects/:streamId',
  'POST /api/diff/:streamId' = 'POST /api/diff/:streamId',
  'POST /objects/:streamId' = 'POST /objects/:streamId',
  'GET /objects/:streamId/:objectId' = 'GET /objects/:streamId/:objectId',
  'GET /objects/:streamId/:objectId/single' = 'GET /objects/:streamId/:objectId/single'
}

type RateLimiterOptions = {
  [key in RateLimitAction]: BurstyRateLimiterOptions
}

interface RateLimitContext extends AuthContext {
  ip: string
}

interface RequestWithContext extends express.Request {
  context: RateLimitContext
}

export const LIMITS: RateLimiterOptions = {
  ALL_REQUESTS: {
    limitCount: getIntFromEnv('RATELIMIT_ALL_REQUESTS', '864000'), // 10 per second
    duration: 1 * TIME.day
  },
  USER_CREATE: {
    limitCount: getIntFromEnv('RATELIMIT_USER_CREATE', '1000'),
    duration: 1 * TIME.week
  },
  STREAM_CREATE: {
    limitCount: getIntFromEnv('RATELIMIT_STREAM_CREATE', '10000'), // 0.11 per second
    duration: 1 * TIME.week
  },
  COMMIT_CREATE: {
    limitCount: getIntFromEnv('RATELIMIT_COMMIT_CREATE', '86400'), // 1 per second
    duration: 1 * TIME.day
  },
  'POST /api/getobjects/:streamId': {
    limitCount: getIntFromEnv('RATELIMIT_POST_GETOBJECTS_STREAMID', '200'),
    duration: 1 * TIME.minute
  },
  'POST /api/diff/:streamId': {
    limitCount: getIntFromEnv('RATELIMIT_POST_DIFF_STREAMID', '200'),
    duration: 1 * TIME.minute
  },
  'POST /objects/:streamId': {
    limitCount: getIntFromEnv('RATELIMIT_POST_OBJECTS_STREAMID', '200'),
    duration: 1 * TIME.minute
  },
  'GET /objects/:streamId/:objectId': {
    limitCount: getIntFromEnv('RATELIMIT_GET_OBJECTS_STREAMID_OBJECTID', '200'),
    duration: 1 * TIME.minute
  },
  'GET /objects/:streamId/:objectId/single': {
    limitCount: getIntFromEnv('RATELIMIT_GET_OBJECTS_STREAMID_OBJECTID_SINGLE', '200'),
    duration: 1 * TIME.minute
  },
  'POST /graphql': {}
}

export const sendRateLimitResponse = (
  res: express.Response,
  rateLimitBreached: RateLimitBreached
): express.Response => {
  res.setHeader('Retry-After', rateLimitBreached.msBeforeNext / 1000)
  res.removeHeader('X-RateLimit-Remaining')
  res.setHeader(
    'X-RateLimit-Reset',
    new Date(Date.now() + rateLimitBreached.msBeforeNext).toISOString()
  )
  res.setHeader('X-Speckle-Meditation', 'https://http.cat/429')
  return res.status(429).send({
    err: 'You are sending too many requests. You have been rate limited. Please try again later.'
  })
}

const getActionForPath = (path: string, verb: string): RateLimitAction => {
  try {
    const maybeAction = `${verb} ${path}` as keyof typeof RateLimitAction
    return RateLimitAction[maybeAction]
  } catch {
    return RateLimitAction.ALL_REQUESTS
  }
}

const getSourceFromRequest = (req: express.Request): string => {
  let source: string | null =
    ((req as RequestWithContext)?.context?.userId as string) ?? getIpFromRequest(req)

  if (!source) source = 'unknown'
  return source
}

export const rateLimiterMiddleware = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (isTestEnv()) next()

  const action = getActionForPath(req.path, req.method)
  const source = getSourceFromRequest(req)

  const rateLimitResult = await getRateLimitResult(action, source)
  if (isRateLimitBreached(rateLimitResult)) {
    return sendRateLimitResponse(res, rateLimitResult)
  } else {
    try {
      res.setHeader('X-RateLimit-Remaining', rateLimitResult.remainingPoints)
      next()
    } catch (err) {
      if (!(err instanceof RateLimitError)) throw err
      return sendRateLimitResponse(res, err.rateLimitBreached)
    }
  }
}

type RateLimiterMapping = {
  [key in RateLimitAction]: (
    source: string
  ) => Promise<RateLimitSuccess | RateLimitBreached>
}

// we need to take the Bursty specific type because its not an Abstract.
// why define the Abstract then?
export const createConsumer =
  (rateLimiter: RateLimiterAbstract | BurstyRateLimiter) =>
  async (source: string): Promise<RateLimitSuccess | RateLimitBreached> => {
    try {
      const rateLimitRes = await rateLimiter.consume(source)
      return {
        isWithinLimits: true,
        remainingPoints: rateLimitRes.remainingPoints
      }
    } catch (err) {
      if (err instanceof RateLimiterRes)
        return { isWithinLimits: false, msBeforeNext: err.msBeforeNext }
      throw err
    }
  }

const initializeRedisRateLimiters = (): RateLimiterMapping => {
  const redisClient = new Redis(getRedisUrl(), {
    enableReadyCheck: false,
    maxRetriesPerRequest: null
  })
  const allActions = Object.values(RateLimitAction)
  const mapping = Object.fromEntries(
    allActions.map((action) => {
      const limits = LIMITS[action]
      const burstyLimiter = new BurstyRateLimiter(
        new RateLimiterRedis({
          storeClient: redisClient,
          keyPrefix: action,
          points: limits.regularOptions.limitCount,
          duration: limits.regularOptions.duration,
          inMemoryBlockOnConsumed: limits.regularOptions.limitCount, // stops additional requests going to Redis once the limit is reached
          inMemoryBlockDuration: limits.regularOptions.duration,
          insuranceLimiter: new RateLimiterMemory({
            keyPrefix: action,
            points: limits.regularOptions.limitCount,
            duration: limits.regularOptions.duration
          })
        }),
        new RateLimiterRedis({
          storeClient: redisClient,
          keyPrefix: `BURST_${action}`,
          points: limits.burstOptions.limitCount,
          duration: limits.burstOptions.duration,
          inMemoryBlockOnConsumed: limits.burstOptions.limitCount,
          inMemoryBlockDuration: limits.burstOptions.duration,
          insuranceLimiter: new RateLimiterMemory({
            keyPrefix: `BURST_${action}`,
            points: limits.burstOptions.limitCount,
            duration: limits.burstOptions.duration
          })
        })
      )

      return [action, createConsumer(burstyLimiter)]
    })
  )
  // i know that all the values are in there, but TS doesn't...
  return mapping as RateLimiterMapping
}

const RATE_LIMITERS = initializeRedisRateLimiters()

interface RateLimitResult {
  isWithinLimits: boolean
}

interface RateLimitSuccess extends RateLimitResult {
  isWithinLimits: true
  remainingPoints: number
}

interface RateLimitBreached extends RateLimitResult {
  isWithinLimits: false
  msBeforeNext: number
}

const isRateLimitBreached = (
  rateLimitResult: RateLimitResult
): rateLimitResult is RateLimitBreached => !rateLimitResult.isWithinLimits

export async function getRateLimitResult(
  action: RateLimitAction,
  source: string,
  rateLimiterMapping: RateLimiterMapping = RATE_LIMITERS
): Promise<RateLimitSuccess | RateLimitBreached> {
  const consumerFunc = rateLimiterMapping[action]
  return await consumerFunc(source)
}
