import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricInitializer } from '@/observability/types.js'

export const init: MetricInitializer = (config) => {
  const { labelNames, namePrefix, logger } = config
  const connections = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_used_connections'], '_'),
    help: 'Number of active (used) database connections',
    labelNames: ['region', ...labelNames]
  })
  return async (params) => {
    const { dbClients, labels } = params
    await Promise.all(
      dbClients.map(async ({ client, regionKey }) => {
        const connectionResults = await client.raw<{
          rows: [{ used_connections: string }]
        }>(`SELECT COUNT(*) AS used_connections FROM pg_stat_activity;`)
        if (!connectionResults.rows.length) {
          logger.error(
            { region: regionKey },
            "No active connections found for region '{region}'. This is odd."
          )
          return
        }
        connections.set(
          { ...labels, region: regionKey },
          parseInt(connectionResults.rows[0].used_connections)
        )
      })
    )
  }
}
