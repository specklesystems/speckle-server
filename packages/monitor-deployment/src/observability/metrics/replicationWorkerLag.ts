import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricInitializer } from '@/observability/types.js'

export const init: MetricInitializer = (config) => {
  const { labelNames, namePrefix, logger } = config
  const promMetric = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_replication_worker_lag'], '_'),
    help: 'Lag of replication workers, by type of lag',
    labelNames: ['region', 'lagtype', ...labelNames]
  })
  return async (params) => {
    const { dbClients, labels } = params
    await Promise.all(
      dbClients.map(async ({ client, regionKey }) => {
        const queryResults = await client.raw<{
          rows: [{ write_lag: number; flush_lag: number; replay_lag: number }]
        }>(`
          SELECT write_lsn - sent_lsn AS write_lag,
            flush_lsn - write_lsn AS flush_lag,
            replay_lsn - flush_lsn AS replay_lag
            FROM pg_stat_replication;
          `)
        if (!queryResults.rows.length) {
          logger.error(
            { region: regionKey },
            "No database workers found for region '{region}'. This is odd."
          )
          return
        }
        promMetric.set(
          { ...labels, region: regionKey, lagtype: 'write' },
          queryResults.rows[0].write_lag
        )
        promMetric.set(
          { ...labels, region: regionKey, lagtype: 'flush' },
          queryResults.rows[0].flush_lag
        )
        promMetric.set(
          { ...labels, region: regionKey, lagtype: 'replay' },
          queryResults.rows[0].replay_lag
        )
      })
    )
  }
}
