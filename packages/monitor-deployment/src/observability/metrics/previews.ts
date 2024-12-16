import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricInitializer } from '@/observability/types.js'

export const init: MetricInitializer = (config) => {
  const { labelNames, namePrefix, logger } = config
  const previews = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_previews'], '_'),
    help: 'Number of previews, by status',
    labelNames: ['status', 'region', ...labelNames]
  })
  return async (params) => {
    const { dbClients, labels } = params
    await Promise.all(
      dbClients.map(async ({ client, regionKey }) => {
        try {
          const previewStatusResults = await client.raw<{
            rows: [{ previewStatus: number; count: string }]
          }>(`
        SELECT "previewStatus", count(*)
        FROM object_preview
        GROUP BY "previewStatus";
        `)

          const remainingPreviewStatus = new Set(Array(4).keys())
          for (const row of previewStatusResults.rows) {
            remainingPreviewStatus.delete(row.previewStatus)
            previews.set(
              { ...labels, region: regionKey, status: row.previewStatus.toString() },
              parseInt(row.count)
            )
          }
          // zero-values for all remaining preview statuses
          remainingPreviewStatus.forEach((status) => {
            previews.set({ ...labels, region: regionKey, status: status.toString() }, 0)
          })
        } catch (err) {
          logger.warn(
            { err, region: regionKey },
            "Failed to collect private status metrics from region '{region}'. This may be because the region is not yet registered and has no 'object_preview' table."
          )
        }
      })
    )
  }
}
