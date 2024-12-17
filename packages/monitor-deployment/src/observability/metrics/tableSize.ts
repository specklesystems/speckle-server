import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricInitializer } from '@/observability/types.js'

export const init: MetricInitializer = (config) => {
  const { labelNames, namePrefix } = config
  const tablesize = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_tablesize'], '_'),
    help: 'Size of tables in the database, by table (in bytes)',
    labelNames: ['table', 'region', ...labelNames]
  })
  return async (params) => {
    const { dbClients, labels } = params
    await Promise.all(
      dbClients.map(async ({ client, regionKey }) => {
        const tableSizeResults = await client.raw<{
          rows: [{ table_name: string; table_size: string }] //bigints are returned as strings
        }>(
          `
            SELECT
              table_name,
              table_size

            FROM (
                  SELECT
                    pg_catalog.pg_namespace.nspname           AS schema_name,
                    relname                                   AS table_name,
                    pg_relation_size(pg_catalog.pg_class.oid) AS table_size

                  FROM pg_catalog.pg_class
                    JOIN pg_catalog.pg_namespace ON relnamespace = pg_catalog.pg_namespace.oid
                ) t
            WHERE schema_name = 'public'
            ORDER BY table_size DESC;
          `
        )
        for (const row of tableSizeResults.rows) {
          tablesize.set(
            { ...labels, table: row.table_name, region: regionKey },
            parseInt(row.table_size) //NOTE risk this bigint being too big for JS, but that would be a very large table!
          )
        }
      })
    )
  }
}
