import { ensureErrorOrWrapAsCause } from '@/modules/shared/errors/ensureError'
import { join, merge } from 'lodash'
import VError from 'verror'
import {
  FreeConnectionsCalculators,
  MultiDBCheck,
  ReadinessHandler,
  RedisCheck
} from '@/healthchecks/types'
import { LivenessError, ReadinessError } from '@/healthchecks/errors'
import { calculatePercentageFreeConnections } from '@/healthchecks/connectionPool'
import { getGenericRedis } from '@/modules/shared/redis/redis'

export const handleLivenessFactory =
  (deps: {
    isRedisAlive: RedisCheck
    areAllPostgresAlive: MultiDBCheck
    getFreeConnectionsCalculators: () => FreeConnectionsCalculators
  }) =>
  async () => {
    const allPostgresResults = await deps.areAllPostgresAlive()
    const deadPostgresKeys = Object.entries(allPostgresResults)
      .filter((result) => !result[1].isAlive)
      .map((result) => result[0])

    if (deadPostgresKeys.length) {
      throw new LivenessError(
        `Readiness health check failed. Postgres for ${join(
          deadPostgresKeys,
          ', '
        )} is not available.`,
        {
          cause: new VError.MultiError(
            Object.entries(allPostgresResults).map((kv) =>
              ensureErrorOrWrapAsCause(
                //HACK: kv[1] is not typed correctly as the filter does not narrow the type
                (kv[1] as { isAlive: false; err: unknown }).err,
                'Unknown Postgres error.'
              )
            )
          )
        }
      )
    }

    const redisClient = getGenericRedis()
    const redisCheck = await deps.isRedisAlive({ client: redisClient })
    if (!redisCheck.isAlive) {
      throw new LivenessError('Liveness health check failed. Redis is not available.', {
        cause: ensureErrorOrWrapAsCause(redisCheck.err, 'Unknown Redis error.')
      })
    }

    const percentageFreeConnections = calculatePercentageFreeConnections({
      ...deps
    })
    const failingfreeConnectionsAboveThresholdKeys: string[] = []
    for (const [region, percentageFree] of Object.entries(percentageFreeConnections)) {
      //unready if less than 10%
      if (percentageFree < 10) {
        failingfreeConnectionsAboveThresholdKeys.push(region)
      }
    }
    if (failingfreeConnectionsAboveThresholdKeys.length) {
      throw new LivenessError(
        `Liveness health check failed. Insufficient free database connections for a sustained duration for regions ${join(
          failingfreeConnectionsAboveThresholdKeys,
          ', '
        )}.`
      )
    }

    return {
      details: {
        postgres: merge(
          allPostgresResults,
          Object.fromEntries(
            Object.entries(percentageFreeConnections).map(([k, v]) => [
              k,
              { percentageFreeConnections: v.toFixed(0) }
            ])
          )
        ),
        redis: true
      }
    }
  }

export const handleReadinessFactory = (deps: {
  isRedisAlive: RedisCheck
  getFreeConnectionsCalculators: () => FreeConnectionsCalculators
}): ReadinessHandler => {
  return async () => {
    const redisClient = getGenericRedis()
    const redisCheck = await deps.isRedisAlive({ client: redisClient })
    if (!redisCheck.isAlive) {
      throw new ReadinessError(
        'Readiness health check failed. Redis is not available.',
        {
          cause: ensureErrorOrWrapAsCause(redisCheck.err, 'Unknown Redis error.')
        }
      )
    }

    const percentageFreeConnections = calculatePercentageFreeConnections({
      ...deps
    })
    const failingfreeConnectionsAboveThresholdKeys: string[] = []
    for (const [region, percentageFree] of Object.entries(percentageFreeConnections)) {
      //unready if less than 10%
      if (percentageFree < 10) {
        failingfreeConnectionsAboveThresholdKeys.push(region)
      }
    }
    if (failingfreeConnectionsAboveThresholdKeys.length) {
      throw new LivenessError(
        `Liveness health check failed. Insufficient free database connections for a sustained duration for regions ${join(
          failingfreeConnectionsAboveThresholdKeys,
          ', '
        )}.`
      )
    }

    return {
      details: {
        postgres: Object.fromEntries(
          Object.entries(percentageFreeConnections).map(([k, v]) => [
            k,
            { percentageFreeConnections: v.toFixed(0) }
          ])
        ),
        redis: true
      }
    }
  }
}
