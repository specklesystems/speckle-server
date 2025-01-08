import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricInitializer } from '@/observability/types.js'

export const init: MetricInitializer = (config) => {
  const { labelNames, namePrefix, logger } = config
  const metric = new prometheusClient.Gauge({
    name: join([namePrefix, 'db', 'max_logical_replication_workers'], '_'),
    help: 'Configured value of max_logical_replication_workers for the Postgres database',
    labelNames: ['region', ...labelNames]
  })
  return async (params) => {
    const { dbClients, labels } = params
    await Promise.all(
      dbClients.map(async ({ client, regionKey }) => {
        const queryResults = await client.raw<{
          rows: [{ max_logical_replication_workers: string }]
        }>(`SHOW max_logical_replication_workers;`)
        if (!queryResults.rows.length) {
          logger.error(
            { region: regionKey },
            "No max_logical_replication_workers found for region '{region}'. This is odd."
          )
          return
        }
        metric.set(
          { ...labels, region: regionKey },
          parseInt(queryResults.rows[0].max_logical_replication_workers)
        )
      })
    )
  }
}
