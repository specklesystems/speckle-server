import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricInitializer } from '@/observability/types.js'

export const init: MetricInitializer = (config) => {
  const { labelNames, namePrefix, logger } = config
  const dbWorkers = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_workers'], '_'),
    help: 'Number of database workers',
    labelNames: ['region', ...labelNames]
  })
  return async (params) => {
    const { dbClients, labels } = params
    await Promise.all(
      dbClients.map(async ({ client, regionKey }) => {
        const connectionResults = await client.raw<{
          rows: [{ worker_count: string }]
        }>(`SELECT COUNT(*) AS worker_count FROM pg_stat_activity;`)
        if (!connectionResults.rows.length) {
          logger.error(
            { region: regionKey },
            "No database workers found for region '{region}'. This is odd."
          )
          return
        }
        dbWorkers.set(
          { ...labels, region: regionKey },
          parseInt(connectionResults.rows[0].worker_count)
        )
      })
    )
  }
}
