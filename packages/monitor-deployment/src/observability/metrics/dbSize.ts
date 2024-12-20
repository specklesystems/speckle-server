import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricInitializer } from '@/observability/types.js'

export const init: MetricInitializer = (config) => {
  const { labelNames, namePrefix, logger } = config
  const dbSize = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_size'], '_'),
    help: 'Size of the entire database (in bytes)',
    labelNames: ['region', ...labelNames]
  })

  return async (params) => {
    const { dbClients, labels } = params
    await Promise.all(
      dbClients.map(async ({ client, regionKey, databaseName }) => {
        if (!databaseName) {
          logger.warn(
            { region: regionKey },
            "Could not get database name from client config for region '{region}'"
          )
          return
        }

        logger.info(
          { region: regionKey, databaseName },
          "Collecting database size for region '{region}' from database '{databaseName}'"
        )

        const dbSizeResult = await client.raw<{
          rows: [{ pg_database_size: string }] //bigints are returned as strings
        }>('SELECT pg_database_size(?) LIMIT 1', [databaseName])
        if (!dbSizeResult.rows.length) {
          logger.error(
            { region: regionKey },
            "No database size found for region '{region}'. This is odd."
          )
          return
        }
        dbSize.set(
          { ...labels, region: regionKey },
          parseInt(dbSizeResult.rows[0].pg_database_size) //NOTE risk this bigint being too big for JS, but that would be a very large database!
        )
      })
    )
  }
}
