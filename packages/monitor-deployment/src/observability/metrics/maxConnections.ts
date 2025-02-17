import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricInitializer } from '@/observability/types.js'

export const init: MetricInitializer = (config) => {
  const { labelNames, namePrefix, logger } = config
  const totalConnections = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_max_connections'], '_'),
    help: 'Maximum number of database connections allowed by the server',
    labelNames: ['region', ...labelNames]
  })
  return async (params) => {
    const { dbClients, labels } = params
    await Promise.all(
      dbClients.map(async ({ client, regionKey }) => {
        const connectionResults = await client.raw<{
          rows: [{ maximum_connections: number }]
        }>(
          `SELECT setting::int AS maximum_connections FROM pg_settings WHERE name=$$max_connections$$;`
        )
        if (!connectionResults.rows.length) {
          logger.error(
            { region: regionKey },
            "No maximum connections found for region '{region}'. This is odd."
          )
          return
        }
        totalConnections.set(
          { ...labels, region: regionKey },
          connectionResults.rows[0].maximum_connections
        )
      })
    )
  }
}
