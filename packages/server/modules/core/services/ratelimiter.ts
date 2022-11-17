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
import { getIpFromRequest } from '@/modules/shared/utils/ip'
import Sentry from '@sentry/node'

export class RateLimitError extends BaseError {
  static defaultMessage =
    'You have sent too many requests. You are being rate limited. Please try again later.'
  static code = 'RATE_LIMIT_ERROR'
}

// typescript definitions
type RateLimitAction = string
type RateLimitSource = string

type RateLimiterOption = {
  limitCount: number
  duration: number
}

type RateLimiterOptions = {
  [key: RateLimitAction]: RateLimiterOption
}

interface RateLimitContext extends AuthContext {
  ip: string
}

interface RequestWithContext extends express.Request {
  context: RateLimitContext
}

interface isWithinRateLimitsConfig {
  action: RateLimitAction
  source: RateLimitSource
}

// data

export const LIMITS: RateLimiterOptions = {
  ALL_REQUESTS_BURST: {
    limitCount: getIntFromEnv('RATELIMIT_USER_CREATE', '1500'), // 500 per second
    duration: 3 * TIME.second
  },
  ALL_REQUESTS: {
    limitCount: getIntFromEnv('RATELIMIT_USER_CREATE', '864000'), // 10 per second
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
  }
}

const redisClient = new Redis(getRedisUrl(), {
  enableReadyCheck: false,
  maxRetriesPerRequest: null
})

export const sendRateLimitResponse = (
  res: express.Response,
  action: string,
  rateLimiterRes: RateLimiterRes | undefined
): express.Response => {
  if (rateLimiterRes instanceof Error) {
    Sentry.captureException(rateLimiterRes)
    res.setHeader('X-Speckle-Meditation', 'https://http.cat/500')
    return res.status(500).send({
      err: 'Error when attempting to determine rate limit. Please try again later.'
    })
  }
  if (rateLimiterRes) {
    res.setHeader('Retry-After', rateLimiterRes.msBeforeNext / 1000)
    res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints)
    res.setHeader(
      'X-RateLimit-Reset',
      new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString()
    )
  }
  if (action) {
    const opts = LIMITS[action]
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

  const burstAction = 'ALL_REQUESTS_BURST'
  const action = 'ALL_REQUESTS'

  const source: string = (req as RequestWithContext)?.context?.userId
    ? ((req as RequestWithContext)?.context?.userId as string)
    : getIpFromRequest(req)

  isWithinRateLimits({ action, source })
    .catch((rateLimiterResponse) => {
      sendRateLimitResponse(res, action, rateLimiterResponse)
    })
    .then(() => isWithinRateLimits({ action: burstAction, source }))
    .catch((rateLimiterResponse) => {
      sendRateLimitResponse(res, burstAction, rateLimiterResponse)
    })
    .then(() => next())
}

// Promise will reject if the source is not within limits for the action, resolve otherwise
export async function isWithinRateLimits({
  action,
  source
}: isWithinRateLimitsConfig): Promise<RateLimiterRes> {
  const rlOpts = LIMITS[action]
  if (!rlOpts) return Promise.reject(null) // the rate limits for the action have not been defined, so prevent use of the action

  const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: action,
    points: rlOpts.limitCount,
    duration: rlOpts.duration
  })

  return rateLimiter.consume(source)
}
