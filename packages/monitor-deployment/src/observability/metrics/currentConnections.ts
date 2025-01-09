import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricInitializer } from '@/observability/types.js'

export const init: MetricInitializer = (config) => {
  const { labelNames, namePrefix, logger } = config
  const currentConnections = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_connections'], '_'),
    help: 'Age of database connections, by sql query, in milliseconds',
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
            SELECT datname, state, query, ROUND((EXTRACT(EPOCH FROM clock_timestamp()) - EXTRACT(EPOCH FROM query_start)) * 1000) AS interval
                FROM pg_stat_activity
                WHERE state <> 'idle'
                    AND query NOT LIKE '% FROM pg_stat_activity %'
                    AND query NOT LIKE 'START_REPLICATION SLOT %'
                    AND query NOT LIKE '<insufficient privilege>'
                ORDER BY interval DESC
                LIMIT 100;
            `
          )
          currentConnections.reset()
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
