import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricInitializer } from '@/observability/types.js'
import Environment from '@speckle/shared/dist/commonjs/environment/index.js'

type QueryResponseSchema = {
  rows: [{ subname: string; subenabled: boolean }]
}

const { FF_WORKSPACES_MULTI_REGION_ENABLED } = Environment.getFeatureFlags()

export const init: MetricInitializer = (config) => {
  if (!FF_WORKSPACES_MULTI_REGION_ENABLED) {
    return async () => {
      // Do nothing
    }
  }

  const { labelNames, namePrefix, logger } = config
  const promMetric = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_subscriptions_enabled'], '_'),
    help: 'Enabled subscriptions to other databases',
    labelNames: ['region', 'subscriptionname', ...labelNames]
  })
  return async (params) => {
    const { dbClients, labels } = params
    await Promise.all(
      dbClients.map(async ({ client, regionKey }) => {
        let queryResults: QueryResponseSchema | undefined = undefined
        try {
          queryResults = await client.raw<QueryResponseSchema>(`
            SELECT subname, subenabled FROM aiven_extras.pg_list_all_subscriptions();
          `)
        } catch (err) {
          if (
            err instanceof Error &&
            err.message.includes('schema "aiven_extras" does not exist')
          ) {
            logger.warn(
              { err, region: regionKey },
              "'aiven_extras' extension is not yet enabled for region '{region}'."
            )
            return // continue to next region
          }

          //else rethrow
          throw err
        }
        if (!queryResults?.rows.length) {
          logger.error(
            { region: regionKey },
            "No database replication slots found for region '{region}'. This is odd."
          )
          return
        }
        for (const row of queryResults.rows) {
          promMetric.set(
            { ...labels, region: regionKey, subscriptionname: row.subname },
            row.subenabled ? 1 : 0
          )
        }
      })
    )
  }
}
