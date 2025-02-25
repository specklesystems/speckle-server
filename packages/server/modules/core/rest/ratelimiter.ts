import type { Request, RequestHandler, Response } from 'express'
import {
  getActionForPath,
  throwIfRateLimited,
  type RateLimitBreached,
  type RateLimiterMapping
} from '@/modules/core/utils/ratelimiter'
import { isRateLimiterEnabled } from '@/modules/shared/helpers/envHelper'
import { getRequestPath } from '@/modules/core/helpers/server'
import { getTokenFromRequest } from '@/modules/shared/middleware'
import { getIpFromRequest } from '@/modules/shared/utils/ip'

export const createRateLimiterMiddleware = (params?: {
  rateLimiterMapping?: RateLimiterMapping
}): RequestHandler => {
  const { rateLimiterMapping } = params || {}
  return async (req, res, next) => {
    const rateLimiterEnabled = isRateLimiterEnabled()
    if (!rateLimiterEnabled) return next()
    const path = getRequestPath(req) || ''
    const action = getActionForPath(path, req.method)
    const source = getSourceFromRequest(req)
    const rateLimitResult = await throwIfRateLimited({
      rateLimiterEnabled,
      rateLimiterMapping,
      action,
      source,
      handleRateLimitBreachPriorToThrowing: addRateLimitHeadersToResponseFactory(res)
    })

    if (res.headersSent) return res
    if (rateLimitResult)
      res.setHeader('X-RateLimit-Remaining', rateLimitResult.remainingPoints)
    return next()
  }
}

export const addRateLimitHeadersToResponseFactory = (res: Response) => {
  return (rateLimitBreached: RateLimitBreached) =>
    addRateLimitHeadersToResponse(res, rateLimitBreached)
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
