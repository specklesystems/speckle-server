/* eslint-disable camelcase */
import express from 'express'
import Redis from 'ioredis'
import {
  getRedisUrl,
  isTestEnv,
  getIntFromEnv
} from '@/modules/shared/helpers/envHelper'
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible'
import { TIME } from '@speckle/shared'
import { AuthContext } from '@/modules/shared/authz'
import { BaseError } from '@/modules/shared/errors'

export class RateLimitError extends BaseError {
  static defaultMessage =
    'You have sent too many requests. You are being rate limited. Please try again later.'
  static code = 'RATE_LIMIT_ERROR'
}

// typescript definitions
type RateLimiterOption = {
  limitCount: number
  duration: number
}

type RateLimiterOptions = {
  [key: string]: RateLimiterOption
}

interface RequestWithContext extends express.Request {
  context: AuthContext
}

// data

export const LIMITS: RateLimiterOptions = {
  ALL_REQUESTS: {
    limitCount: getIntFromEnv('RATELIMIT_USER_CREATE', '300'), //FIXME set to a low number for testing, should be higher than REST API limit
    duration: 3 * TIME.second //FIXME set to a low number for testing. 1 * TIME.minute
  },
  USER_CREATE: {
    limitCount: getIntFromEnv('RATELIMIT_USER_CREATE', '1000'),
    duration: 1 * TIME.week
  },
  STREAM_CREATE: {
    limitCount: getIntFromEnv('RATELIMIT_STREAM_CREATE', '10000'),
    duration: 1 * TIME.week
  },
  COMMIT_CREATE: {
    limitCount: getIntFromEnv('RATELIMIT_COMMIT_CREATE', '86400'),
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
  }
}

const redisClient = new Redis(getRedisUrl(), {
  enableReadyCheck: false,
  maxRetriesPerRequest: null
})

export const sendRateLimitResponse = (
  res: express.Response,
  rateLimiterRes: RateLimiterRes | undefined,
  opts: RateLimiterOption | undefined
): express.Response => {
  if (rateLimiterRes) {
    res.setHeader('Retry-After', rateLimiterRes.msBeforeNext / 1000)
    res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints)
    res.setHeader(
      'X-RateLimit-Reset',
      new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString()
    )
  }
  if (opts) {
    res.setHeader('X-RateLimit-Limit', opts.limitCount)
  }

  res.setHeader('X-Speckle-Meditation', 'https://http.cat/429')
  return res.status(429).send({
    err: 'You are sending too many requests. You have been rate limited. Please try again later.'
  }) // TODO we should return a branded page (either here, or via nginx)
}

export const rateLimiterMiddleware = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (isTestEnv()) next()

  const action = 'ALL_REQUESTS'
  const rlOpts = LIMITS[action]
  const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: action,
    points: rlOpts.limitCount,
    duration: rlOpts.duration
  })

  const rateLimitKey: string = (req as RequestWithContext)?.context?.userId
    ? ((req as RequestWithContext)?.context?.userId as string)
    : req.ip

  rateLimiter
    .consume(rateLimitKey)
    .then(() => {
      next()
    })
    .catch((rateLimiterResponse) => {
      console.log(`Rate limiting action '${action}' on key '${rateLimitKey}'`) //HACK remove after debugging
      sendRateLimitResponse(res, rateLimiterResponse, rlOpts)
    })
}

interface respectsLimitsConfig {
  action: string
  source: string
}

// returns true if the action is fine, false if it should be blocked because of exceeding limit
export async function respectsLimits({
  action,
  source
}: respectsLimitsConfig): Promise<boolean> {
  const rlOpts = LIMITS[action]
  if (!rlOpts) return false // the rate limits for the action have not been defined, so prevent use of the action

  const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: action,
    points: rlOpts.limitCount,
    duration: rlOpts.duration
  })

  return rateLimiter
    .consume(source)
    .then(() => {
      return true
    })
    .catch(() => {
      return false
    })
}

interface requestContext {
  userId: string
  ip: string
}

interface expressRequestWithContext extends express.Request {
  context: requestContext
}

interface rejectsRequestsParameters {
  action: string
  req: expressRequestWithContext
  res: express.Response
}

export async function rejectsRequestWithRatelimitStatusIfNeeded({
  action,
  req,
  res
}: rejectsRequestsParameters) {
  const source = req.context.userId || req.context.ip
  if (!(await respectsLimits({ action, source })))
    return sendRateLimitResponse(res, undefined, undefined)
}
