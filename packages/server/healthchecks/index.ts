import { healthCheckLogger } from '@/logging/logging'
import { highFrequencyMetricsCollectionPeriodMs } from '@/modules/shared/helpers/envHelper'
import { handleLivenessFactory, handleReadinessFactory } from '@/healthchecks/health'
import { FreeConnectionsCalculator, ReadinessHandler } from '@/healthchecks/types'
import { isRedisAlive } from '@/healthchecks/redis'
import { areAllPostgresAlive } from '@/healthchecks/postgres'
import { Application } from 'express'
import { knexFreeDbConnectionSamplerFactory } from '@/healthchecks/connectionPool'
import { getAllRegisteredDbClients } from '@/modules/multiregion/utils/dbSelector'

const knexFreeDbConnectionSamplerLiveness: Record<
  string,
  FreeConnectionsCalculator & {
    start: () => void
  }
> = {}
const knexFreeDbConnectionSamplerReadiness: Record<
  string,
  FreeConnectionsCalculator & {
    start: () => void
  }
> = {}

export const getKnexFreeDbConnectionSamplerLiveness = () =>
  knexFreeDbConnectionSamplerLiveness
export const getKnexFreeDbConnectionSamplerReadiness = () =>
  knexFreeDbConnectionSamplerReadiness

export const updateFreeDbConnectionSamplers = async () => {
  const allClients = await getAllRegisteredDbClients()
  for (const dbClient of allClients) {
    if (!(dbClient.regionKey in knexFreeDbConnectionSamplerLiveness)) {
      knexFreeDbConnectionSamplerLiveness[dbClient.regionKey] =
        knexFreeDbConnectionSamplerFactory({
          db: dbClient.client,
          collectionPeriod: highFrequencyMetricsCollectionPeriodMs(),
          sampledDuration: 600_000 //number of ms over which to average the database connections, before declaring not alive. 10 minutes.
        })
      knexFreeDbConnectionSamplerLiveness[dbClient.regionKey].start()
    }

    if (!(dbClient.regionKey in knexFreeDbConnectionSamplerReadiness)) {
      knexFreeDbConnectionSamplerReadiness[dbClient.regionKey] =
        knexFreeDbConnectionSamplerFactory({
          db: dbClient.client,
          collectionPeriod: highFrequencyMetricsCollectionPeriodMs(),
          sampledDuration: 20_000 //number of ms over which to average the database connections, before declaring unready. 20 seconds.
        })
      knexFreeDbConnectionSamplerReadiness[dbClient.regionKey].start()
    }
  }
}

export const initFactory: () => (
  app: Application,
  isInitial: boolean
) => Promise<{ isReady: ReadinessHandler }> = () => {
  return async (app) => {
    healthCheckLogger.info('💓 Init health check')
    await updateFreeDbConnectionSamplers()

    const livenessHandler = handleLivenessFactory({
      isRedisAlive,
      areAllPostgresAlive,
      getFreeConnectionsCalculators: getKnexFreeDbConnectionSamplerLiveness
    })
    app.get('/liveness', async (req, res) => {
      const result = await livenessHandler()
      res.status(200).json({ status: 'ok', ...result })
    })

    const readinessHandler = handleReadinessFactory({
      isRedisAlive,
      areAllPostgresAlive,
      getFreeConnectionsCalculators: getKnexFreeDbConnectionSamplerReadiness
    })

    return { isReady: readinessHandler }
  }
}
