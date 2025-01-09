import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricInitializer } from '@/observability/types.js'

export const init: MetricInitializer = (config) => {
  const { labelNames, namePrefix, logger } = config
  const fileimports = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_fileimports'], '_'),
    help: 'Number of imported files, by type and status',
    labelNames: ['filetype', 'status', 'region', ...labelNames]
  })
  return async (params) => {
    const { dbClients, labels } = params
    await Promise.all(
      dbClients.map(async ({ client, regionKey }) => {
        try {
          const importedFiles = await client.raw<{
            rows: [{ fileType: string; convertedStatus: number; count: string }]
          }>(
            `
        SELECT LOWER("fileType") AS "fileType", "convertedStatus", count(*)
          FROM file_uploads
          GROUP BY (LOWER("fileType"), "convertedStatus");
      `
          )

          // Get the set of all unique file types and converted statuses in the database
          const allFileImportConvertedStatusAndFileTypes = importedFiles.rows.reduce(
            (acc, row) => {
              acc.convertedStatus.add(row.convertedStatus)
              acc.fileType.add(row.fileType)
              acc.presentConvertedStatusAndFileType.add(
                `${row.convertedStatus}:::${row.fileType}`
              )
              return acc
            },
            {
              convertedStatus: new Set<number>(),
              fileType: new Set<string>(),
              presentConvertedStatusAndFileType: new Set<string>()
            }
          )

          // now calculate the combinatorial set of all possible file types and statuses
          const remainingConvertedStatusAndFileTypes = new Set<string>()
          allFileImportConvertedStatusAndFileTypes.convertedStatus.forEach((status) => {
            allFileImportConvertedStatusAndFileTypes.fileType.forEach((fileType) => {
              remainingConvertedStatusAndFileTypes.add(`${status}:::${fileType}`)
            })
          })

          // now set the counts for the file types and statuses that are in the database
          for (const row of importedFiles.rows) {
            remainingConvertedStatusAndFileTypes.delete(
              `${row.convertedStatus}:::${row.fileType}`
            )

            fileimports.set(
              {
                ...labels,
                filetype: row.fileType,
                status: row.convertedStatus.toString(),
                region: regionKey
              },
              parseInt(row.count)
            )
          }
          // zero-values for all remaining file types and statuses
          remainingConvertedStatusAndFileTypes.forEach((formattedStatusAndFileType) => {
            const [status, fileType] = formattedStatusAndFileType.split(':::')
            fileimports.set(
              {
                ...labels,
                filetype: fileType,
                status,
                region: regionKey
              },
              0
            )
          })
        } catch (err) {
          logger.warn(
            { err, region: regionKey },
            "Failed to collect file import status metrics from region '{region}'. This may be because the region is not yet registered and has no file_uploads table."
          )
        }
      })
    )
  }
}
