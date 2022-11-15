/* eslint-disable camelcase */
import Redis from 'ioredis'
import express from 'express'
import {
  getRedisUrl,
  isTestEnv,
  getIntFromEnv
} from '@/modules/shared/helpers/envHelper'
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible'
import { AuthContext } from '@/modules/shared/authz'

// typescript definitions

type RateLimiters = {
  [key: string]: RateLimiterRedis
}

interface RequestWithContext extends express.Request {
  context: AuthContext
}

const redisClient = new Redis(getRedisUrl(), {
  enableReadyCheck: false,
  maxRetriesPerRequest: null
})

const TIME = {
  second: 1,
  minute: 60,
  hour: 60 * 60,
  day: 24 * 60 * 60,
  week: 7 * 24 * 60 * 60,
  month: 28 * 24 * 60 * 60
}

type RateLimiterOption = {
  limitCount: number
  duration: number
}

type RateLimiterOptions = {
  [key: string]: RateLimiterOption
}

const LIMITS: RateLimiterOptions = {
  rate_limiter_all_requests: {
    limitCount: 200, //FIXME set to a low number for testing, should be higher than REST API limit
    duration: 2 * TIME.second //FIXME set to a low number for testing. 1 * TIME.minute
  },
  USER_CREATE: {
    limitCount: getIntFromEnv('RATELIMIT_USER_CREATE') || 1000,
    duration: 1 * TIME.week
  },
  STREAM_CREATE: {
    limitCount: getIntFromEnv('RATELIMIT_STREAM_CREATE') || 10000,
    duration: 1 * TIME.week
  },
  COMMIT_CREATE: {
    limitCount: getIntFromEnv('RATELIMIT_COMMIT_CREATE') || 86400,
    duration: 1 * TIME.day
  },
  'POST /api/getobjects/:streamId': {
    limitCount: getIntFromEnv('RATELIMIT_POST_GETOBJECTS_STREAMID') || 200,
    duration: 1 * TIME.minute
  },
  'POST /api/diff/:streamId': {
    limitCount: getIntFromEnv('RATELIMIT_POST_DIFF_STREAMID') || 200,
    duration: 1 * TIME.minute
  },
  'POST /objects/:streamId': {
    limitCount: getIntFromEnv('RATELIMIT_POST_OBJECTS_STREAMID') || 200,
    duration: 1 * TIME.minute
  },
  'GET /objects/:streamId/:objectId': {
    limitCount: getIntFromEnv('RATELIMIT_GET_OBJECTS_STREAMID_OBJECTID') || 200,
    duration: 1 * TIME.minute
  },
  'GET /objects/:streamId/:objectId/single': {
    limitCount: getIntFromEnv('RATELIMIT_GET_OBJECTS_STREAMID_OBJECTID_SINGLE') || 200,
    duration: 1 * TIME.minute
  }
}

// Build RateLimiters

const rateLimiters: RateLimiters = (function (): RateLimiters {
  // function which is called immediately to map an object with dynamic keys
  // to another object with dynamic keys
  // FIXME: is there a better way??
  const rls: RateLimiters = {}

  for (const [k, v] of Object.entries(LIMITS)) {
    rls[k] = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: k,
      points: v.limitCount,
      duration: v.duration
    })
  }
  return rls
})()

const sendRateLimitResponse = (
  res: express.Response,
  rateLimiterRes: RateLimiterRes,
  opts: RateLimiterOption
): express.Response => {
  res.setHeader('Retry-After', rateLimiterRes.msBeforeNext / 1000)
  res.setHeader('X-RateLimit-Limit', opts.limitCount)
  res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints)
  res.setHeader(
    'X-RateLimit-Reset',
    new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString()
  )
  res.setHeader('X-Speckle-Meditation', 'https://http.cat/429')
  return res.status(429).send({
    err: 'You are sending too many requests. You have been rate limited. Please try again later.'
  }) // TODO we should return a branded page (either here, or via nginx)
}

export const rateLimiterMiddlewareBuilder = (rateLimiterKey: string) => {
  const rlOpts: RateLimiterOption = LIMITS[rateLimiterKey]
  const rl: RateLimiterRedis = rateLimiters[rateLimiterKey]

  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (isTestEnv()) next()

    const rateLimitKey: string = (req as RequestWithContext)?.context?.userId
      ? ((req as RequestWithContext)?.context?.userId as string)
      : req.ip

    rl.consume(rateLimitKey)
      .then(() => {
        next()
      })
      .catch((rateLimiterRes) => {
        console.log('rate limiting on key: ', rateLimitKey)
        sendRateLimitResponse(res, rateLimiterRes, rlOpts)
      })
  }
}

export const rejectsRequestWithRatelimitStatusIfNeeded = (
  action: string,
  req: express.Request,
  res: express.Response
) => {
  if (isTestEnv()) return

  const rlOpts: RateLimiterOption = LIMITS[action]
  const rl: RateLimiterRedis = rateLimiters[action]

  const rateLimitKey: string = (req as RequestWithContext)?.context?.userId
    ? ((req as RequestWithContext)?.context?.userId as string)
    : req.ip

  rl.consume(rateLimitKey)
    .then(() => {
      return
    })
    .catch((rateLimiterRes) => {
      console.log('rate limiting on key: ', rateLimitKey)
      return sendRateLimitResponse(res, rateLimiterRes, rlOpts)
    })
}
