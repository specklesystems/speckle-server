import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricInitializer } from '@/observability/types.js'

export const init: MetricInitializer = (config) => {
  const { labelNames, namePrefix, logger } = config
  const metric = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_wal_level_is_logical'], '_'),
    help: "Indicates whether the value of wal_level for the Postgres database is 'logical'",
    labelNames: ['region', ...labelNames]
  })
  return async (params) => {
    const { dbClients, labels } = params
    await Promise.all(
      dbClients.map(async ({ client, regionKey }) => {
        const queryResults = await client.raw<{
          rows: [{ wal_level: string }]
        }>(`SHOW wal_level;`)
        if (!queryResults.rows.length) {
          logger.error(
            { region: regionKey },
            "No wal_level found for region '{region}'. This is odd."
          )
          return
        }
        metric.set(
          { ...labels, region: regionKey },
          queryResults.rows[0].wal_level === 'logical' ? 1 : 0
        )
      })
    )
  }
}
