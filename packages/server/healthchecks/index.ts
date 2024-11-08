import { healthCheckLogger } from '@/logging/logging'
import { highFrequencyMetricsCollectionPeriodMs } from '@/modules/shared/helpers/envHelper'
import { handleLivenessFactory, handleReadinessFactory } from '@/healthchecks/health'
import { FreeConnectionsCalculator } from '@/healthchecks/types'
import { isRedisAlive } from '@/healthchecks/redis'
import { areAllPostgresAlive } from '@/healthchecks/postgres'
import { Application } from 'express'
import { knexFreeDbConnectionSamplerFactory } from '@/healthchecks/connectionPool'
import { getAllClients } from '@/modules/multiregion/dbSelector'

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
  const allClients = await getAllClients()
  for (const [key, client] of Object.entries(allClients)) {
    if (!(key in knexFreeDbConnectionSamplerLiveness)) {
      knexFreeDbConnectionSamplerLiveness[key] = knexFreeDbConnectionSamplerFactory({
        db: client,
        collectionPeriod: highFrequencyMetricsCollectionPeriodMs(),
        sampledDuration: 600_000 //number of ms over which to average the database connections, before declaring not alive. 10 minutes.
      })
      knexFreeDbConnectionSamplerLiveness[key].start()
    }

    if (!(key in knexFreeDbConnectionSamplerReadiness)) {
      knexFreeDbConnectionSamplerReadiness[key] = knexFreeDbConnectionSamplerFactory({
        db: client,
        collectionPeriod: highFrequencyMetricsCollectionPeriodMs(),
        sampledDuration: 20_000 //number of ms over which to average the database connections, before declaring unready. 20 seconds.
      })
      knexFreeDbConnectionSamplerReadiness[key].start()
    }
  }
}

export const initFactory: () => (
  app: Application,
  isInitial: boolean
) => Promise<void> = () => {
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

    app.get('/readiness', async (req, res) => {
      const result = await readinessHandler()
      res.status(200).json({ status: 'ok', ...result })
    })
  }
}
