import * as express from 'express'
import { getServerInfo } from '@/modules/core/services/generic'
import { createRedisClient } from '@/modules/shared/redis/redis'
import { getRedisUrl } from '@/modules/shared/helpers/envHelper'
import type { Redis } from 'ioredis'
import { calculateRemainingCapacity } from '@/logging/knexMonitoring'

export default (app: express.Application) => {
  app.options('/liveness')
  app.get('/liveness', handleLiveness)
  app.options('/readiness')
  app.get('/readiness', handleReadiness)
}

/**
 * Liveness check, if it fails, will eventually kubernetes or docker compose to restart the pod
 */
const handleLiveness: express.RequestHandler = async (req, res) => {
  try {
    await getServerInfo()
  } catch (err) {
    req.log.error(err, 'Health check failed. Postgres is not available.')
    res.status(500).json({
      message: 'Postgres is not available',
      error: err
    })
    res.send()
    return
  }

  let client: Redis | undefined = undefined
  try {
    client = createRedisClient(getRedisUrl(), {})
    const redisRes = await client.ping()
    if (redisRes !== 'PONG') {
      res.status(500).json({
        message: 'Redis is not available'
      })
      req.log.error('Health check failed. Redis is not available.')
    } else {
      res.status(200).json({ message: 'OK' })
      req.log.trace('Health check passed.')
    }
  } finally {
    await client?.quit()
    res.send()
  }
}

/**
 * Readiness check, if it fails, will eventually cause kubernetes or docker compose to stop the pod from receiving traffic
 */
const handleReadiness: express.RequestHandler = async (req, res) => {
  if (calculateRemainingCapacity() <= 0) {
    res.status(503).json({
      message: 'Service is not ready'
    })
    res.send()
    return
  }

  res.status(200).json({ message: 'OK' })
  res.send()
}
