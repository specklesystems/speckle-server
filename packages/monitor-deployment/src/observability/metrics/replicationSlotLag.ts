import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricInitializer } from '@/observability/types.js'

export const init: MetricInitializer = (config) => {
  const { labelNames, namePrefix, logger } = config
  const promMetric = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_replication_slot_lag'], '_'),
    help: 'Lag of replication slots in bytes',
    labelNames: ['region', ...labelNames]
  })
  return async (params) => {
    const { dbClients, labels } = params
    await Promise.all(
      dbClients.map(async ({ client, regionKey }) => {
        const queryResults = await client.raw<{
          rows: [{ slot_lag_bytes: number }]
        }>(`
            SELECT pg_current_wal_lsn() - confirmed_flush_lsn AS slot_lag_bytes
              FROM pg_replication_slots;
          `)
        if (!queryResults.rows.length) {
          logger.error(
            { region: regionKey },
            "No database replication slots found for region '{region}'. This is odd."
          )
          return
        }
        promMetric.set(
          { ...labels, region: regionKey },
          queryResults.rows[0].slot_lag_bytes
        )
      })
    )
  }
}
