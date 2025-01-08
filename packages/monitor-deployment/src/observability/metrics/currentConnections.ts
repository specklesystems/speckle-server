import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricInitializer } from '@/observability/types.js'
import Interval from 'postgres-interval'

export const init: MetricInitializer = (config) => {
  const { labelNames, namePrefix, logger } = config
  const currentConnections = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_connections'], '_'),
    help: 'Age of database connections, by sql query',
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
            SELECT datname, state, query, clock_timestamp() - query_start AS interval
                FROM pg_stat_activity
                WHERE state <> 'idle'
                    AND query NOT LIKE '% FROM pg_stat_activity %'
                    AND query NOT LIKE 'START_REPLICATION SLOT %'
                    AND query NOT LIKE '<insufficient privilege>'
                ORDER BY interval DESC
                LIMIT 100;
            `
          )
          for (const row of currentConnectionResults.rows) {
            const interval = Interval(row.interval)

            currentConnections.set(
              { ...labels, query: row.query, region: regionKey },
              intervalToMilliseconds(interval)
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

const intervalToMilliseconds = (interval: Interval.IPostgresInterval) => {
  return (
    interval.years * 31536000000 + //assumes 365 days exactly
    interval.months * 2592000000 + //assumes 30 days
    interval.days * 86400000 +
    interval.hours * 3600000 +
    interval.minutes * 60000 +
    interval.seconds * 1000 +
    interval.milliseconds
  )
}
