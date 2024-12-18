import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricInitializer } from '@/observability/types.js'

export const init: MetricInitializer = (config) => {
  const { labelNames, namePrefix, logger } = config
  const objects = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_objects'], '_'),
    help: 'Number of objects',
    labelNames: [...labelNames, 'region']
  })

  return async (params) => {
    const { dbClients, labels } = params
    await Promise.all(
      dbClients.map(async ({ client, regionKey }) => {
        try {
          const objectsEstimate = await client.raw<{
            rows: [{ estimate: number }]
          }>(
            "SELECT reltuples AS estimate FROM pg_class WHERE relname = 'objects' LIMIT 1;"
          )
          if (objectsEstimate.rows.length) {
            objects.set(
              { ...labels, region: regionKey },
              Math.max(objectsEstimate.rows[0]?.estimate, 0)
            )
          }
        } catch (err) {
          logger.warn(
            { err, region: regionKey },
            "Failed to collect objects from region '{region}'. This may be because the region is not yet registered and has no 'objects' table."
          )
        }
      })
    )
  }
}
