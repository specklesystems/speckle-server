import * as express from 'express'
import { getServerInfo } from '@/modules/core/services/generic'
import { createRedisClient } from '@/modules/shared/redis/redis'
import { getRedisUrl, postgresMaxConnections } from '@/modules/shared/helpers/envHelper'
import type { Redis } from 'ioredis'
import { numberOfFreeConnections } from '@/modules/shared/helpers/dbHelper'
import { db } from '@/db/knex'
import { hasStartupCompleted } from '@/app'

export default (app: express.Application) => {
  app.options('/liveness')
  app.get('/liveness', handleLiveness)
  app.options('/readiness')
  app.get('/readiness', handleReadiness)
}

const handleLiveness: express.RequestHandler = async (req, res) => {
  if (!hasStartupCompleted()) {
    req.log.error('Liveness health check failed. Startup has not yet completed.')
    res.status(500).json({
      message: 'Startup has not yet completed.'
    })
    res.send()
    return
  }

  const postgres = await isPostgresAlive()
  if (!postgres.isAlive) {
    req.log.error(
      postgres.err,
      'Liveness health check failed. Postgres is not available.'
    )
    res.status(500).json({
      message: 'Postgres is not available',
      error: postgres.err
    })
    res.send()
    return
  }

  const redis = await isRedisAlive()
  if (!redis.isAlive) {
    req.log.error(redis.err, 'Liveness health check failed. Redis is not available.')
    res.status(500).json({
      message: 'Redis is not available.',
      error: redis.err
    })
    res.send()
    return
  }
}

const handleReadiness: express.RequestHandler = async (req, res) => {
  if (!hasStartupCompleted()) {
    req.log.error('Readiness health check failed. Startup has not yet completed.')
    res.status(500).json({
      message: 'Startup has not yet completed.'
    })
    res.send()
    return
  }

  const postgres = await isPostgresAlive()
  if (!postgres.isAlive) {
    req.log.error(
      postgres.err,
      'Readiness health check failed. Postgres is not available.'
    )
    res.status(500).json({
      message: 'Postgres is not available',
      error: postgres.err
    })
    res.send()
    return
  }

  const redis = await isRedisAlive()
  if (!redis.isAlive) {
    req.log.error(redis.err, 'Readiness health check failed. Redis is not available.')
    res.status(500).json({
      message: 'Redis is not available.',
      error: redis.err
    })
    res.send()
    return
  }

  const numFreeConnections = await numberOfFreeConnections(db)
  //less than 5%
  if (Math.floor((numFreeConnections * 100) / postgresMaxConnections()) < 5) {
    const message =
      'Readiness health check failed. Insufficient free database connections.'
    req.log.error(message)
    res.status(500).json({
      message
    })
    res.send()
    return
  }
}

type CheckResponse = { isAlive: true } | { isAlive: false; err: unknown }

const isPostgresAlive = async (): Promise<CheckResponse> => {
  try {
    await getServerInfo()
  } catch (err) {
    return { isAlive: false, err }
  }
  return { isAlive: true }
}

const isRedisAlive = async (): Promise<CheckResponse> => {
  let client: Redis | undefined = undefined
  let result: CheckResponse = { isAlive: true }
  try {
    client = createRedisClient(getRedisUrl(), {})
    const redisResponse = await client.ping()
    if (redisResponse !== 'PONG') {
      result = { isAlive: false, err: 'Redis did not respond correctly.' }
    }
  } catch (err) {
    result = { isAlive: false, err }
  } finally {
    await client?.quit()
    return result
  }
}
