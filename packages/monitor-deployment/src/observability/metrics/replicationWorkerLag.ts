import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricInitializer } from '@/observability/types.js'
import Environment from '@speckle/shared/dist/commonjs/environment/index.js'

const { FF_WORKSPACES_MULTI_REGION_ENABLED } = Environment.getFeatureFlags()

export const init: MetricInitializer = (config) => {
  if (!FF_WORKSPACES_MULTI_REGION_ENABLED) {
    return async () => {
      // Do nothing
    }
  }

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
            FROM aiven_extras.pg_stat_replication_list();
          `)
        if (!queryResults.rows.length) {
          logger.error(
            { region: regionKey },
            "No database workers found for region '{region}'. This is odd."
          )
          return
        }
        for (const row of queryResults.rows) {
          const writeLag = parseInt(row.write_lag)
          if (!isNaN(writeLag)) {
            promMetric.set(
              {
                ...labels,
                region: regionKey,
                lagtype: 'write',
                name: row.application_name
              },
              parseInt(row.write_lag)
            )
          }
          const flushLag = parseInt(row.flush_lag)
          if (!isNaN(flushLag)) {
            promMetric.set(
              {
                ...labels,
                region: regionKey,
                lagtype: 'flush',
                name: row.application_name
              },
              parseInt(row.flush_lag)
            )
          }
          const replayLag = parseInt(row.replay_lag)
          if (!isNaN(replayLag)) {
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
        }
      })
    )
  }
}
