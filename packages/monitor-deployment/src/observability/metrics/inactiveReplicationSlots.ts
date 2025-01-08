import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricInitializer } from '@/observability/types.js'

export const init: MetricInitializer = (config) => {
  const { labelNames, namePrefix, logger } = config
  const connections = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_inactive_replication_slots'], '_'),
    help: 'Number of inactive database replication slots',
    labelNames: ['region', ...labelNames]
  })
  return async (params) => {
    const { dbClients, labels } = params
    await Promise.all(
      dbClients.map(async ({ client, regionKey }) => {
        const connectionResults = await client.raw<{
          rows: [{ inactive_replication_slots: string }]
        }>(
          `SELECT count(*) AS inactive_replication_slots FROM pg_replication_slots WHERE NOT active;`
        )
        if (!connectionResults.rows.length) {
          logger.error(
            { region: regionKey },
            "No data related to replication slots found for region '{region}'. This is odd."
          )
          return
        }
        connections.set(
          { ...labels, region: regionKey },
          parseInt(connectionResults.rows[0].inactive_replication_slots)
        )
      })
    )
  }
}
