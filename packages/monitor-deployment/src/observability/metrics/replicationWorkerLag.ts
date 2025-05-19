import prometheusClient from 'prom-client'
import { join } from 'lodash-es'
import type { MetricInitializer } from '@/observability/types.js'
import * as Environment from '@speckle/shared/environment'

const { FF_WORKSPACES_MULTI_REGION_ENABLED } = Environment.getFeatureFlags()

type QueryResponseSchema = {
  rows: [
    {
      write_lag: string
      flush_lag: string
      replay_lag: string
      subscription_name: string
    }
  ]
}

export const init: MetricInitializer = (config) => {
  if (!FF_WORKSPACES_MULTI_REGION_ENABLED) {
    return async () => {
      // Do nothing
    }
  }

  const { labelNames, namePrefix, logger } = config
  const promMetric = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_replication_worker_lag'], '_'),
    help: 'Lag of replication workers, by type of lag',
    labelNames: ['region', 'lagtype', 'subscriptionname', ...labelNames]
  })
  return async (params) => {
    const { dbClients, labels } = params
    await Promise.all(
      dbClients.map(async ({ client, regionKey }) => {
        let queryResults: QueryResponseSchema | undefined = undefined
        try {
          // sent_lsn is the data that has been received by the worker
          // write_lsn is the data that has been written to the WAL, but it may be cached and not yet flushed to disk
          // flush_lsn is the data that has been flushed to disk
          // replay_lsn is the data that is visible to the user (may differ from flush_lsn if there is a replication conflict)
          queryResults = await client.raw<QueryResponseSchema>(`
          SELECT sent_lsn - write_lsn  AS write_lag,
            write_lsn - flush_lsn AS flush_lag,
            flush_lsn - replay_lsn AS replay_lag,
            application_name AS subscription_name
            FROM aiven_extras.pg_stat_replication_list();
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
            "No database workers found for region '{region}'. This is odd."
          )
          return
        }
        for (const row of queryResults.rows) {
          const writeLag = parseInt(row.write_lag)
          if (!isNaN(writeLag)) {
            promMetric.set(
              {
                ...labels,
                region: regionKey,
                lagtype: 'write',
                subscriptionname: row.subscription_name
              },
              parseInt(row.write_lag)
            )
          }
          const flushLag = parseInt(row.flush_lag)
          if (!isNaN(flushLag)) {
            promMetric.set(
              {
                ...labels,
                region: regionKey,
                lagtype: 'flush',
                subscriptionname: row.subscription_name
              },
              parseInt(row.flush_lag)
            )
          }
          const replayLag = parseInt(row.replay_lag)
          if (!isNaN(replayLag)) {
            promMetric.set(
              {
                ...labels,
                region: regionKey,
                lagtype: 'replay',
                subscriptionname: row.subscription_name
              },
              parseInt(row.replay_lag)
            )
          }
        }
      })
    )
  }
}
