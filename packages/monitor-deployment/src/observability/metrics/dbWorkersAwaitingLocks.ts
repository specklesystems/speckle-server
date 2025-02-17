import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricInitializer } from '@/observability/types.js'

export const init: MetricInitializer = (config) => {
  const { labelNames, namePrefix, logger } = config
  const promMetric = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_workers_awaiting_locks'], '_'),
    help: 'Number of database workers awaiting locks',
    labelNames: ['region', ...labelNames]
  })
  return async (params) => {
    const { dbClients, labels } = params
    await Promise.all(
      dbClients.map(async ({ client, regionKey }) => {
        const queryResults = await client.raw<{
          rows: [{ count: string }]
        }>(`SELECT COUNT(*) FROM pg_stat_activity WHERE wait_event = 'Lock';`)
        if (!queryResults.rows.length) {
          logger.error(
            { region: regionKey },
            "No database workers found for region '{region}'. This is odd."
          )
          return
        }
        promMetric.set(
          { ...labels, region: regionKey },
          parseInt(queryResults.rows[0].count)
        )
      })
    )
  }
}
