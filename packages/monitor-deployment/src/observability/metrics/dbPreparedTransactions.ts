import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricInitializer } from '@/observability/types.js'

export const init: MetricInitializer = (config) => {
  const { labelNames, namePrefix, logger } = config
  const dbWorkers = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_prepared_transactions'], '_'),
    help: 'Number of prepared transactions',
    labelNames: ['region', ...labelNames]
  })
  return async (params) => {
    const { dbClients, labels } = params
    await Promise.all(
      dbClients.map(async ({ client, regionKey }) => {
        const connectionResults = await client.raw<{
          rows: [{ prepared_transaction_count: string }]
        }>(`SELECT COUNT(*) AS prepared_transaction_count FROM pg_prepared_xacts;`)
        if (!connectionResults.rows.length) {
          logger.error(
            { region: regionKey },
            "No prepared transactions found for region '{region}'. This is odd."
          )
          return
        }
        dbWorkers.set(
          { ...labels, region: regionKey },
          parseInt(connectionResults.rows[0].prepared_transaction_count)
        )
      })
    )
  }
}
