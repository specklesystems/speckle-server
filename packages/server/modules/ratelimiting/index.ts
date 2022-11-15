import Redis from 'ioredis'
import express from 'express'
import { getRedisUrl } from '@/modules/shared/helpers/envHelper'
import { RateLimiterRedis } from 'rate-limiter-flexible'

const redisClient = new Redis(getRedisUrl(), {
  enableReadyCheck: false,
  maxRetriesPerRequest: null
})

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'middleware',
  points: 10, // 10 requests
  duration: 1 // per 1 second by IP
})

export const rateLimiterMiddleware = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  rateLimiter
    .consume(req.ip)
    .then(() => {
      next()
    })
    .catch(() => {
      res.status(429).send('Too Many Requests')
    })
}
