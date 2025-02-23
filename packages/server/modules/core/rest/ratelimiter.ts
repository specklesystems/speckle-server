import type { Request, RequestHandler, Response } from 'express'
import {
  getActionForPath,
  getRateLimitResult,
  isRateLimitBreached,
  RATE_LIMITERS,
  type RateLimitBreached,
  type RateLimiterMapping
} from '@/modules/core/services/ratelimiter'
import { isRateLimiterEnabled } from '@/modules/shared/helpers/envHelper'
import { getRequestPath } from '@/modules/core/helpers/server'
import { RateLimitError } from '@/modules/core/errors/ratelimit'
import { ensureError } from '@speckle/shared'
import { getTokenFromRequest } from '@/modules/shared/middleware'
import { getIpFromRequest } from '@/modules/shared/utils/ip'

export const createRateLimiterMiddleware = (
  rateLimiterMapping: RateLimiterMapping = RATE_LIMITERS
): RequestHandler => {
  return async (req, res, next) => {
    if (!isRateLimiterEnabled()) return next()
    const path = getRequestPath(req) || ''
    const action = getActionForPath(path, req.method)
    const source = getSourceFromRequest(req)
    try {
      const rateLimitResult = await getRateLimitResult(
        action,
        source,
        rateLimiterMapping
      )
      if (isRateLimitBreached(rateLimitResult)) {
        addRateLimitHeadersToResponse(res, rateLimitResult)
        return next(new RateLimitError(rateLimitResult))
      } else {
        if (res.headersSent) return res
        res.setHeader('X-RateLimit-Remaining', rateLimitResult.remainingPoints)
        return next()
      }
    } catch (err) {
      const e = !(err instanceof RateLimitError)
        ? new RateLimitError(
            {
              isWithinLimits: false,
              msBeforeNext: 0,
              action
            },
            'Unknown rate limit error',
            { cause: ensureError(err) }
          )
        : err

      addRateLimitHeadersToResponse(res, e.rateLimitBreached)
      return next(e)
    }
  }
}

export const addRateLimitHeadersToResponse = (
  res: Response,
  rateLimitBreached: RateLimitBreached
) => {
  if (res.headersSent) return res
  res.setHeader('Retry-After', rateLimitBreached.msBeforeNext / 1000)
  res.removeHeader('X-RateLimit-Remaining')
  res.setHeader(
    'X-RateLimit-Reset',
    new Date(Date.now() + rateLimitBreached.msBeforeNext).toISOString()
  )
  res.setHeader('X-Speckle-Meditation', 'https://http.cat/429')
}

export const getSourceFromRequest = (req: Request): string => {
  let source: string | null =
    req?.context?.userId ||
    getTokenFromRequest(req)?.substring(10) || // token ID
    getIpFromRequest(req)

  if (!source) source = 'unknown'
  return source
}
