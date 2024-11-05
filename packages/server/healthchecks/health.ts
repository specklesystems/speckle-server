import { createRedisClient } from '@/modules/shared/redis/redis'
import { getRedisUrl, postgresMaxConnections } from '@/modules/shared/helpers/envHelper'
import type { Redis } from 'ioredis'
import { numberOfFreeConnections } from '@/modules/shared/helpers/dbHelper'
import { db } from '@/db/knex'
import type { Knex } from 'knex'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { BaseError } from '@/modules/shared/errors'
import { ensureErrorOrWrapAsCause } from '@/modules/shared/errors/ensureError'

export type ReadinessHandler = () => Promise<{ details: Record<string, string> }>

export type FreeConnectionsCalculator = {
  mean: () => number
}

class LivenessError extends BaseError {
  static defaultMessage = 'The application is not yet alive. Please try again later.'
  static code = 'LIVENESS_ERROR'
  static statusCode = 500
}

class ReadinessError extends BaseError {
  static defaultMessage =
    'The application is not ready to accept requests. Please try again later.'
  static code = 'READINESS_ERROR'
  static statusCode = 500
}

export const handleLivenessFactory =
  (deps: {
    isRedisAlive: RedisCheck
    isPostgresAlive: DBCheck
    freeConnectionsCalculator: FreeConnectionsCalculator
  }) =>
  async () => {
    const postgres = await deps.isPostgresAlive()
    if (!postgres.isAlive) {
      throw new LivenessError(
        'Liveness health check failed. Postgres is not available.',
        {
          cause: ensureErrorOrWrapAsCause(postgres.err, 'Unknown postgres error.')
        }
      )
    }

    const redis = await deps.isRedisAlive()
    if (!redis.isAlive) {
      throw new LivenessError('Liveness health check failed. Redis is not available.', {
        cause: ensureErrorOrWrapAsCause(redis.err, 'Unknown redis error.')
      })
    }

    const numFreeConnections = await deps.freeConnectionsCalculator.mean()
    const percentageFreeConnections = Math.floor(
      (numFreeConnections * 100) / postgresMaxConnections()
    )
    //unready if less than 10%
    if (percentageFreeConnections < 10) {
      throw new LivenessError(
        'Liveness health check failed. Insufficient free database connections for a sustained duration.'
      )
    }

    return {
      details: {
        postgres: 'true',
        redis: 'true',
        percentageFreeConnections: percentageFreeConnections.toFixed(0)
      }
    }
  }

export const handleReadinessFactory = (deps: {
  isRedisAlive: RedisCheck
  isPostgresAlive: DBCheck
  freeConnectionsCalculator: FreeConnectionsCalculator
}): ReadinessHandler => {
  return async () => {
    const postgres = await deps.isPostgresAlive()
    if (!postgres.isAlive) {
      throw new ReadinessError(
        'Readiness health check failed. Postgres is not available.',
        { cause: ensureErrorOrWrapAsCause(postgres.err, 'Unknown postgres error.') }
      )
    }

    const redis = await deps.isRedisAlive()
    if (!redis.isAlive) {
      throw new ReadinessError(
        'Readiness health check failed. Redis is not available.',
        { cause: ensureErrorOrWrapAsCause(redis.err, 'Unknown Redis error.') }
      )
    }

    const numFreeConnections = await deps.freeConnectionsCalculator.mean()
    const percentageFreeConnections = Math.floor(
      (numFreeConnections * 100) / postgresMaxConnections()
    )
    //unready if less than 10%
    if (percentageFreeConnections < 10) {
      const message =
        'Readiness health check failed. Insufficient free database connections for a sustained duration.'
      throw new ReadinessError(message)
    }

    return {
      details: {
        postgres: 'true',
        redis: 'true',
        percentageFreeConnections: percentageFreeConnections.toFixed(0)
      }
    }
  }
}

type CheckResponse = { isAlive: true } | { isAlive: false; err: unknown }

type DBCheck = () => Promise<CheckResponse>

export const isPostgresAlive: DBCheck = async (): Promise<CheckResponse> => {
  const getServerInfo = getServerInfoFactory({ db })

  try {
    await getServerInfo()
  } catch (err) {
    return { isAlive: false, err }
  }
  return { isAlive: true }
}

type RedisCheck = () => Promise<CheckResponse>

export const isRedisAlive: RedisCheck = async (): Promise<CheckResponse> => {
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
