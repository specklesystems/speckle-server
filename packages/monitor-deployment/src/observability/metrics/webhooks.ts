import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricInitializer } from '@/observability/types.js'

export const init: MetricInitializer = (config) => {
  const { labelNames, namePrefix, logger } = config
  const webhooks = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_webhooks'], '_'),
    help: 'Number of webhook calls, by status',
    labelNames: ['status', 'region', ...labelNames]
  })
  return async (params) => {
    const { dbClients, labels } = params
    await Promise.all(
      dbClients.map(async ({ client, regionKey }) => {
        try {
          const webhookResults = await client.raw<{
            rows: [{ status: number; count: string }]
          }>(
            `
        SELECT status, count(*)
        FROM webhooks_events
        GROUP BY status;
      `
          )
          const remainingWebhookStatus = new Set(Array(4).keys())
          for (const row of webhookResults.rows) {
            remainingWebhookStatus.delete(row.status)
            webhooks.set(
              { ...labels, status: row.status.toString(), region: regionKey },
              parseInt(row.count) //NOTE risk this bigint being too big for JS, but that would be a very large number of webhooks
            )
          }
          // zero-values for all remaining webhook statuses
          remainingWebhookStatus.forEach((status) => {
            webhooks.set({ ...labels, status: status.toString(), region: regionKey }, 0)
          })
        } catch (err) {
          logger.warn(
            { err, region: regionKey },
            "Failed to collect webhook metrics from region '{region}'. This may be because the region is not yet registered and has no webhooks_events table."
          )
        }
      })
    )
  }
}
