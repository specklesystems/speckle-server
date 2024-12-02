import { healthCheckLogger } from '@/logging/logging'
import { db } from '@/db/knex'
import { highFrequencyMetricsCollectionPeriodMs } from '@/modules/shared/helpers/envHelper'
import {
  handleLivenessFactory,
  handleReadinessFactory,
  knexFreeDbConnectionSamplerFactory,
  isRedisAlive,
  isPostgresAlive,
  ReadinessHandler,
  FreeConnectionsCalculator
} from '@/healthchecks/health'
import { Application } from 'express'

export const initFactory: () => (
  app: Application,
  isInitial: boolean
) => Promise<{ isReady: ReadinessHandler }> = () => {
  let knexFreeDbConnectionSamplerLiveness: FreeConnectionsCalculator & {
    start: () => void
  }
  let knexFreeDbConnectionSamplerReadiness: FreeConnectionsCalculator & {
    start: () => void
  }
  return async (app, isInitial) => {
    healthCheckLogger.info('💓 Init health check')
    if (isInitial) {
      knexFreeDbConnectionSamplerLiveness = knexFreeDbConnectionSamplerFactory({
        db,
        collectionPeriod: highFrequencyMetricsCollectionPeriodMs(),
        sampledDuration: 600000 //number of ms over which to average the database connections, before declaring not alive. 10 minutes.
      })
      knexFreeDbConnectionSamplerLiveness.start()

      knexFreeDbConnectionSamplerReadiness = knexFreeDbConnectionSamplerFactory({
        db,
        collectionPeriod: highFrequencyMetricsCollectionPeriodMs(),
        sampledDuration: 20000 //number of ms over which to average the database connections, before declaring unready. 20 seconds.
      })
      knexFreeDbConnectionSamplerReadiness.start()
    }
    const livenessHandler = handleLivenessFactory({
      isRedisAlive,
      isPostgresAlive,
      freeConnectionsCalculator: knexFreeDbConnectionSamplerLiveness
    })
    app.get('/liveness', async (req, res) => {
      const result = await livenessHandler()
      res.status(200).json({ status: 'ok', ...result })
    })

    return {
      isReady: handleReadinessFactory({
        isRedisAlive,
        isPostgresAlive,
        freeConnectionsCalculator: knexFreeDbConnectionSamplerReadiness
      })
    }
  }
}
