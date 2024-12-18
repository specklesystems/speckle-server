import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricInitializer } from '@/observability/types.js'

export const init: MetricInitializer = (config) => {
  const { labelNames, namePrefix, logger } = config
  const promMetric = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_replication_slot_lag'], '_'),
    help: 'Lag of replication slots in bytes',
    labelNames: ['region', 'slotname', ...labelNames]
  })
  return async (params) => {
    const { dbClients, labels } = params
    await Promise.all(
      dbClients.map(async ({ client, regionKey }) => {
        const queryResults = await client.raw<{
          rows: [{ slot_name: string; slot_lag_bytes: string }]
        }>(`
            SELECT slot_name, pg_current_wal_lsn() - confirmed_flush_lsn AS slot_lag_bytes
              FROM pg_replication_slots WHERE slot_type='logical';
          `)
        if (!queryResults.rows.length) {
          logger.error(
            { region: regionKey },
            "No database replication slots found for region '{region}'. This is odd."
          )
          return
        }
        for (const row of queryResults.rows) {
          promMetric.set(
            { ...labels, region: regionKey, slotname: row.slot_name },
            parseInt(row.slot_lag_bytes)
          )
        }
      })
    )
  }
}
