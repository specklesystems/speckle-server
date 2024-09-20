import * as express from 'express'
import { getServerInfo } from '@/modules/core/services/generic'
import { createRedisClient } from '@/modules/shared/redis/redis'
import {
  getRedisUrl,
  highFrequencyMetricsCollectionPeriodMs,
  postgresMaxConnections
} from '@/modules/shared/helpers/envHelper'
import type { Redis } from 'ioredis'
import { numberOfFreeConnections } from '@/modules/shared/helpers/dbHelper'
import { db } from '@/db/knex'
import type { Knex } from 'knex'
import { HttpMethod, OpenApiDocument } from '@/modules/shared/helpers/typeHelper'

type FreeConnectionsCalculator = {
  mean: () => number
}

export default (params: {
  app: express.Application
  openApiDocument: OpenApiDocument
}) => {
  const { app, openApiDocument } = params
  const knexFreeDbConnectionSamplerLiveness = knexFreeDbConnectionSamplerFactory({
    db,
    collectionPeriod: highFrequencyMetricsCollectionPeriodMs(),
    sampledDuration: 600000 //number of ms over which to average the database connections, before declaring not alive. 10 minutes.
  })
  knexFreeDbConnectionSamplerLiveness.start()

  const knexFreeDbConnectionSamplerReadiness = knexFreeDbConnectionSamplerFactory({
    db,
    collectionPeriod: highFrequencyMetricsCollectionPeriodMs(),
    sampledDuration: 20000 //number of ms over which to average the database connections, before declaring unready. 20 seconds.
  })
  knexFreeDbConnectionSamplerReadiness.start()

  app.options('/liveness')
  openApiDocument.registerOperation('/liveness', HttpMethod.OPTIONS, {
    description: 'Liveness options',
    responses: {
      200: {
        description: 'Options for liveness endpoint.'
      }
    }
  })

  app.get(
    '/liveness',
    handleLivenessFactory({
      isRedisAlive,
      isPostgresAlive,
      freeConnectionsCalculator: knexFreeDbConnectionSamplerLiveness
    })
  )
  openApiDocument.registerOperation('/liveness', HttpMethod.GET, {
    description: 'Indicates whether the application is alive.',
    responses: {
      200: {
        description: 'The application is alive.'
      }
    }
  })

  app.options('/readiness')
  openApiDocument.registerOperation('/readiness', HttpMethod.OPTIONS, {
    description: 'Readiness endpoint options',
    responses: {
      200: {
        description: 'Options were retrieved.'
      }
    }
  })

  app.get(
    '/readiness',
    handleReadinessFactory({
      isRedisAlive,
      isPostgresAlive,
      freeConnectionsCalculator: knexFreeDbConnectionSamplerReadiness
    })
  )
  openApiDocument.registerOperation('/readiness', HttpMethod.GET, {
    description: 'Indicates whether the application is ready to accept traffic',
    responses: {
      200: {
        description: 'The application is ready.'
      }
    }
  })
}

const handleLivenessFactory =
  (deps: {
    isRedisAlive: RedisCheck
    isPostgresAlive: DBCheck
    freeConnectionsCalculator: FreeConnectionsCalculator
  }): express.RequestHandler =>
  async (req, res) => {
    const postgres = await deps.isPostgresAlive()
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

    const redis = await deps.isRedisAlive()
    if (!redis.isAlive) {
      req.log.error(redis.err, 'Liveness health check failed. Redis is not available.')
      res.status(500).json({
        message: 'Redis is not available.',
        error: redis.err
      })
      res.send()
      return
    }

    const numFreeConnections = await deps.freeConnectionsCalculator.mean()
    const percentageFreeConnections = Math.floor(
      (numFreeConnections * 100) / postgresMaxConnections()
    )
    //unready if less than 10%
    if (percentageFreeConnections < 10) {
      const message =
        'Liveness health check failed. Insufficient free database connections for a sustained duration.'
      req.log.error(message)
      res.status(500).json({
        message
      })
      res.send()
      return
    }

    res.status(200)
    res.send()
  }

const handleReadinessFactory = (deps: {
  isRedisAlive: RedisCheck
  isPostgresAlive: DBCheck
  freeConnectionsCalculator: FreeConnectionsCalculator
}): express.RequestHandler => {
  return async (req, res) => {
    const postgres = await deps.isPostgresAlive()
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

    const redis = await deps.isRedisAlive()
    if (!redis.isAlive) {
      req.log.error(redis.err, 'Readiness health check failed. Redis is not available.')
      res.status(500).json({
        message: 'Redis is not available.',
        error: redis.err
      })
      res.send()
      return
    }

    const numFreeConnections = await deps.freeConnectionsCalculator.mean()
    const percentageFreeConnections = Math.floor(
      (numFreeConnections * 100) / postgresMaxConnections()
    )
    //unready if less than 10%
    if (percentageFreeConnections < 10) {
      const message =
        'Readiness health check failed. Insufficient free database connections for a sustained duration.'
      req.log.error(message)
      res.status(500).json({
        message
      })
      res.send()
      return
    }

    res.status(200)
    res.send()
  }
}

type CheckResponse = { isAlive: true } | { isAlive: false; err: unknown }

type DBCheck = () => Promise<CheckResponse>

const isPostgresAlive: DBCheck = async (): Promise<CheckResponse> => {
  try {
    await getServerInfo()
  } catch (err) {
    return { isAlive: false, err }
  }
  return { isAlive: true }
}

type RedisCheck = () => Promise<CheckResponse>

const isRedisAlive: RedisCheck = async (): Promise<CheckResponse> => {
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

export const knexFreeDbConnectionSamplerFactory = (opts: {
  db: Knex
  collectionPeriod: number
  sampledDuration: number
}): FreeConnectionsCalculator & { start: () => void } => {
  const dataQueue = new Array<number>()
  const maxQueueSize = opts.sampledDuration / opts.collectionPeriod
  return {
    start: () => {
      setInterval(() => {
        dataQueue.push(numberOfFreeConnections(opts.db))
        if (dataQueue.length > maxQueueSize) {
          dataQueue.shift()
        }
      }, opts.collectionPeriod)
    },
    mean: () => {
      // return the current value if the queue is empty
      if (!dataQueue.length) return numberOfFreeConnections(opts.db)
      return dataQueue.reduce((a, b) => a + b) / dataQueue.length
    }
  }
}
