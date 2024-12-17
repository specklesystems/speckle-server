import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricInitializer } from '@/observability/types.js'

export const init: MetricInitializer = (config) => {
  const { labelNames, namePrefix, logger } = config
  const streams = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_streams'], '_'),
    help: 'Number of streams/projects',
    labelNames
  })

  return async (params) => {
    const { mainDbClient, labels } = params
    try {
      const streamsEstimate = await mainDbClient.raw<{ rows: [{ estimate: number }] }>(
        "SELECT reltuples AS estimate FROM pg_class WHERE relname = 'streams' LIMIT 1;"
      )
      if (streamsEstimate.rows.length) {
        streams.set({ ...labels }, Math.max(streamsEstimate.rows[0]?.estimate))
      }
    } catch (err) {
      logger.warn(
        err,
        'Failed to collect streams metrics. This may be because the main database is not yet migrated.'
      )
    }
  }
}
