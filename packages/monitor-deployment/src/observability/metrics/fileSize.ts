import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricInitializer } from '@/observability/types.js'

export const init: MetricInitializer = (config) => {
  const { labelNames, namePrefix, logger } = config
  const filesize = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_filesize'], '_'),
    help: 'Size of imported files, by type (in bytes)',
    labelNames: ['filetype', 'region', ...labelNames]
  })
  return async (params) => {
    const { dbClients, labels } = params
    await Promise.all(
      dbClients.map(async ({ client, regionKey }) => {
        try {
          const fileSizeResults = await client.raw<{
            rows: [{ filetype: string; filesize: string }]
          }>(
            `
      SELECT LOWER("fileType") AS fileType, SUM("fileSize") AS fileSize
            FROM file_uploads
            GROUP BY LOWER("fileType");
      `
          )
          for (const row of fileSizeResults.rows) {
            filesize.set(
              { ...labels, filetype: row.filetype, region: regionKey },
              parseInt(row.filesize)
            )
          }
        } catch (err) {
          logger.warn(
            { err, region: regionKey },
            "Failed to collect file upload metrics from region '{region}'. This may be because the region is not yet registered and has no 'file_uploads' table."
          )
        }
      })
    )
  }
}
