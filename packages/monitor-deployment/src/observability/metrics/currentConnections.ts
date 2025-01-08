import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricInitializer } from '@/observability/types.js'

export const init: MetricInitializer = (config) => {
  const { labelNames, namePrefix, logger } = config
  const currentConnections = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_connections'], '_'),
    help: 'Age of database connections, by sql query',
    labelNames: ['query', 'region', ...labelNames]
  })
  return async (params) => {
    const { dbClients, labels } = params
    await Promise.all(
      dbClients.map(async ({ client, regionKey }) => {
        try {
          const currentConnectionResults = await client.raw<{
            rows: [{ datname: string; state: string; query: string; interval: string }]
          }>(
            `
            SELECT datname, state, query, clock_timestamp() - query_start AS interval
                FROM pg_stat_activity
                WHERE state <> 'idle'
                    AND query NOT LIKE '% FROM pg_stat_activity %'
                ORDER BY interval DESC
                LIMIT 20;
            `
          )
          for (const row of currentConnectionResults.rows) {
            currentConnections.set(
              { ...labels, query: row.query, region: regionKey },
              parseInt(row.interval)
            )
          }
        } catch (err) {
          logger.warn(
            { err, region: regionKey },
            "Failed to collect current connections from region '{region}'."
          )
        }
      })
    )
  }
}
