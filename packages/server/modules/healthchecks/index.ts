import { moduleLogger } from '@/logging/logging'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { db } from '@/db/knex'
import { highFrequencyMetricsCollectionPeriodMs } from '@/modules/shared/helpers/envHelper'
import {
  handleLivenessFactory,
  handleReadinessFactory,
  knexFreeDbConnectionSamplerFactory,
  isRedisAlive,
  isPostgresAlive
} from '@/modules/healthchecks/health'

let livenessHandler: () => Promise<{ details: Record<string, string> }>
let readinessHandler: () => Promise<{ details: Record<string, string> }>
export const isAlive: () => Promise<{ details: Record<string, string> }> = () =>
  livenessHandler()
export const isReady: () => Promise<{ details: Record<string, string> }> = () =>
  readinessHandler()

export const init: SpeckleModule['init'] = async (_, isInitial) => {
  moduleLogger.info('💓 Init health check module')
  if (isInitial) {
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

    livenessHandler = handleLivenessFactory({
      isRedisAlive,
      isPostgresAlive,
      freeConnectionsCalculator: knexFreeDbConnectionSamplerLiveness
    })

    readinessHandler = handleReadinessFactory({
      isRedisAlive,
      isPostgresAlive,
      freeConnectionsCalculator: knexFreeDbConnectionSamplerReadiness
    })
  }
}

export const shutdown: SpeckleModule['shutdown'] = async () => {
  //no-op
}
