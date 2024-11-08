import { createRedisClient } from '@/modules/shared/redis/redis'
import { getRedisUrl, postgresMaxConnections } from '@/modules/shared/helpers/envHelper'
import type { Redis } from 'ioredis'
import { numberOfFreeConnections } from '@/modules/shared/helpers/dbHelper'
import type { Knex } from 'knex'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { BaseError } from '@/modules/shared/errors'
import { ensureErrorOrWrapAsCause } from '@/modules/shared/errors/ensureError'
import {
  getMainDbClient,
  getRegisteredRegionClients
} from '@/modules/multiregion/dbSelector'
import { isMultiRegionEnabled } from '@/modules/multiregion/helpers'
import { join } from 'lodash'
import { MultiError } from 'verror'

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
    areAllPostgresAlive: MultiDBCheck
    freeConnectionsCalculator: FreeConnectionsCalculator
  }) =>
  async () => {
    const allPostgresResults = await deps.areAllPostgresAlive()
    const deadPostgresKeys = Object.entries(allPostgresResults)
      .filter((result) => !result[1].isAlive)
      .map((result) => result[0])

    if (deadPostgresKeys.length) {
      throw new ReadinessError(
        `Readiness health check failed. Postgres for ${join(
          deadPostgresKeys,
          ', '
        )} is not available.`,
        {
          cause: new MultiError(
            Object.entries(allPostgresResults).map((kv) =>
              ensureErrorOrWrapAsCause(
                //HACK: kv[1] is not typed correctly as the filter does not narrow the type
                (kv[1] as { isAlive: false; err: unknown }).err,
                'Unknown postgres error.'
              )
            )
          )
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
  areAllPostgresAlive: MultiDBCheck
  freeConnectionsCalculator: FreeConnectionsCalculator
}): ReadinessHandler => {
  return async () => {
    const allPostgresResults = await deps.areAllPostgresAlive()
    const deadPostgres = Object.entries(allPostgresResults).filter(
      (result) => !result[1].isAlive
    )

    if (deadPostgres.length) {
      throw new ReadinessError(
        `Readiness health check failed. Postgres for ${join(
          deadPostgres.map((result) => result[0]),
          ', '
        )} is not available.`,
        {
          cause: new MultiError(
            deadPostgres.map((kv) =>
              ensureErrorOrWrapAsCause(
                //HACK: kv[1] is not typed correctly as the filter does not narrow the type
                (kv[1] as { isAlive: false; err: unknown }).err,
                'Unknown postgres error.'
              )
            )
          )
        }
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

type DBCheck = (params: { db: Knex }) => Promise<CheckResponse>

export const isPostgresAlive: DBCheck = async (params) => {
  const { db } = params
  const getServerInfo = getServerInfoFactory({ db })

  try {
    await getServerInfo()
  } catch (err) {
    return { isAlive: false, err }
  }
  return { isAlive: true }
}

type MultiDBCheck = () => Promise<Record<string, CheckResponse>>

export const areAllPostgresAlive: MultiDBCheck = async (): Promise<
  Record<string, CheckResponse>
> => {
  let publicAndPrivateClients: Record<string, { public: Knex; private?: Knex }> = {}
  publicAndPrivateClients['main'] = await getMainDbClient()
  if (isMultiRegionEnabled()) {
    const regionClients = await getRegisteredRegionClients()
    publicAndPrivateClients = { ...publicAndPrivateClients, ...regionClients }
  }

  const results: Record<string, CheckResponse> = {}
  for (const [key, publicAndPrivateClient] of Object.entries(publicAndPrivateClients)) {
    const client = publicAndPrivateClient.private
      ? publicAndPrivateClient.private
      : publicAndPrivateClient.public
    try {
      results[key] = await isPostgresAlive({ db: client })
    } catch (err) {
      results[key] = {
        isAlive: false,
        err: ensureErrorOrWrapAsCause(err, 'Unknown postgres error.')
      }
    }
  }

  return results
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
