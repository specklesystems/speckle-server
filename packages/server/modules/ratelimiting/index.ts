/* eslint-disable camelcase */
import Redis from 'ioredis'
import express from 'express'
import { getRedisUrl, isTestEnv } from '@/modules/shared/helpers/envHelper'
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

// LIMITS
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
    limitCount: 200,
    duration: 2 * TIME.second
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
) => {
  res.setHeader('Retry-After', rateLimiterRes.msBeforeNext / 1000)
  res.setHeader('X-RateLimit-Limit', opts.limitCount)
  res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints)
  res.setHeader(
    'X-RateLimit-Reset',
    new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString()
  )
  res.status(429).send('Too Many Requests') // TODO we should return a branded page (either here, or via nginx)
}

export const rateLimiterMiddlewareBuilder = (rateLimiterKey: string) => {
  const rl: RateLimiterRedis = rateLimiters[rateLimiterKey]
  const rlOpts: RateLimiterOption = LIMITS[rateLimiterKey]
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
