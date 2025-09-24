import type { Request, RequestHandler, Response } from 'express'
import type { RateLimitSuccess } from '@/modules/core/utils/ratelimiter'
import {
  getActionForPath,
  getRateLimitResult,
  isRateLimitBreached,
  type RateLimitBreached,
  type RateLimiterMapping
} from '@/modules/core/utils/ratelimiter'
import { getRequestPath } from '@/modules/core/helpers/server'
import { getTokenFromRequest } from '@/modules/shared/middleware'
import { getIpFromRequest } from '@/modules/shared/utils/ip'
import type { Nullable } from '@speckle/shared'
import { RateLimitError } from '@/modules/core/errors/ratelimit'

export const createRateLimiterMiddleware = (params: {
  rateLimiterEnabled: boolean
  rateLimiterMapping?: RateLimiterMapping
}): RequestHandler => {
  const { rateLimiterEnabled } = params

  return async (req, res, next) => {
    if (!rateLimiterEnabled) return next()
    const path = getRequestPath(req) || ''
    const action = getActionForPath(path, req.method)
    const source = getSourceFromRequest(req)

    // For batched GQL, count each batch entry as 1 hit
    let hit = 1
    if (action === 'POST /graphql' && Array.isArray(req.body)) {
      hit = req.body.length
    }

    let rateLimitResult: Nullable<RateLimitSuccess | RateLimitBreached> = null
    for (let i = 0; i < hit; i++) {
      rateLimitResult = await getRateLimitResult(action, source)
      if (isRateLimitBreached(rateLimitResult)) {
        addRateLimitHeadersToResponseFactory(res)(rateLimitResult)
        return next(new RateLimitError(rateLimitResult))
      }
    }

    if (res.headersSent) return res
    if (rateLimitResult)
      res.setHeader('X-RateLimit-Remaining', rateLimitResult.remainingPoints)
    return next()
  }
}

export const addRateLimitHeadersToResponseFactory = (res: Response) => {
  return (rateLimitBreached: RateLimitBreached) => {
    if (res.headersSent) return res
    res.setHeader('Retry-After', rateLimitBreached.msBeforeNext / 1000)
    res.removeHeader('X-RateLimit-Remaining')
    res.setHeader(
      'X-RateLimit-Reset',
      new Date(Date.now() + rateLimitBreached.msBeforeNext).toISOString()
    )
    res.setHeader('X-Speckle-Meditation', 'https://http.cat/429')
  }
}

export const getSourceFromRequest = (req: Request): string => {
  let source: string | null =
    req?.context?.userId ||
    getTokenFromRequest(req)?.substring(10) || // token ID
    getIpFromRequest(req)

  if (!source) source = 'unknown'
  return source
}
