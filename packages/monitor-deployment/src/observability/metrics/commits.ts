import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricConfig, MetricInitializer } from '@/observability/types.js'

export const init: MetricInitializer = (config: MetricConfig) => {
  const { labelNames, namePrefix, logger } = config
  const commits = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_commits'], '_'),
    help: 'Number of commits/versions',
    labelNames: [...labelNames, 'region']
  })
  return async (params) => {
    const { dbClients, labels } = params
    await Promise.all(
      dbClients.map(async ({ client, regionKey }) => {
        try {
          const commitsEstimate = await client.raw<{
            rows: [{ estimate: number }]
          }>(
            "SELECT reltuples AS estimate FROM pg_class WHERE relname = 'commits' LIMIT 1;"
          )
          if (commitsEstimate.rows.length) {
            commits.set(
              { ...labels, region: regionKey },
              Math.max(commitsEstimate.rows[0]?.estimate)
            )
          }
        } catch (err) {
          logger.warn(
            { err, region: regionKey },
            "Failed to collect commits metrics from region '{region}'. This may be because the region is not yet registered and has no 'commits' table."
          )
        }
      })
    )
  }
}
