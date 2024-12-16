import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricInitializer } from '@/observability/types.js'

export const init: MetricInitializer = (config) => {
  const { labelNames, namePrefix, logger } = config
  const promMetric = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_replication_worker_lag'], '_'),
    help: 'Lag of replication workers, by type of lag',
    labelNames: ['region', 'lagtype', 'name', ...labelNames]
  })
  return async (params) => {
    const { dbClients, labels } = params
    await Promise.all(
      dbClients.map(async ({ client, regionKey }) => {
        const queryResults = await client.raw<{
          rows: [
            {
              write_lag: string
              flush_lag: string
              replay_lag: string
              application_name: string
            }
          ]
        }>(`
          SELECT write_lsn - sent_lsn AS write_lag,
            flush_lsn - write_lsn AS flush_lag,
            replay_lsn - flush_lsn AS replay_lag,
            application_name
            FROM pg_stat_replication;
          `)
        if (!queryResults.rows.length) {
          logger.error(
            { region: regionKey },
            "No database workers found for region '{region}'. This is odd."
          )
          return
        }
        for (const row of queryResults.rows) {
          promMetric.set(
            {
              ...labels,
              region: regionKey,
              lagtype: 'write',
              name: row.application_name
            },
            parseInt(row.write_lag)
          )
          promMetric.set(
            {
              ...labels,
              region: regionKey,
              lagtype: 'flush',
              name: row.application_name
            },
            parseInt(row.flush_lag)
          )
          promMetric.set(
            {
              ...labels,
              region: regionKey,
              lagtype: 'replay',
              name: row.application_name
            },
            parseInt(row.replay_lag)
          )
        }
      })
    )
  }
}
