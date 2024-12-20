import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricInitializer } from '@/observability/types.js'

export const init: MetricInitializer = (config) => {
  const { labelNames, namePrefix, logger } = config
  const users = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_users'], '_'),
    help: 'Number of users',
    labelNames
  })
  return async (params) => {
    const { mainDbClient, labels } = params
    try {
      const usersEstimate = await mainDbClient.raw<{ rows: [{ estimate: number }] }>(
        "SELECT reltuples AS estimate FROM pg_class WHERE relname = 'users' LIMIT 1;"
      )
      if (usersEstimate.rows.length) {
        users.set({ ...labels }, Math.max(usersEstimate.rows[0]?.estimate))
      }
    } catch (err) {
      logger.warn(
        err,
        "Failed to collect users metrics. This may be because the migrations have not yet occcurred and has no 'users' table."
      )
    }
  }
}
