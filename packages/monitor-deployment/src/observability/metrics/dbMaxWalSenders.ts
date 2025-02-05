import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricInitializer } from '@/observability/types.js'

export const init: MetricInitializer = (config) => {
  const { labelNames, namePrefix, logger } = config
  const metric = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_max_wal_senders'], '_'),
    help: 'Configured value of max_wal_senders for the Postgres database',
    labelNames: ['region', ...labelNames]
  })
  return async (params) => {
    const { dbClients, labels } = params
    await Promise.all(
      dbClients.map(async ({ client, regionKey }) => {
        const queryResults = await client.raw<{
          rows: [{ max_wal_senders: string }]
        }>(`SHOW max_wal_senders;`)
        if (!queryResults.rows.length) {
          logger.error(
            { region: regionKey },
            "No max_wal_senders found for region '{region}'. This is odd."
          )
          return
        }
        metric.set(
          { ...labels, region: regionKey },
          parseInt(queryResults.rows[0].max_wal_senders)
        )
      })
    )
  }
}
