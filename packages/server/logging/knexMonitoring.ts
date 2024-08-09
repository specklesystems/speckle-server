import prometheusClient, { type Registry } from 'prom-client'
import { numberOfFreeConnections } from '@/modules/shared/helpers/dbHelper'
import { type Knex } from 'knex'
import { Logger } from 'pino'
import { toNDecimalPlaces } from '@/modules/core/utils/formatting'

export const initKnexPrometheusMetrics = (params: {
  db: Knex
  register: Registry
  logger: Logger
}) => {
  const normalizeSqlMethods = (sqlMethod: string) => {
    switch (sqlMethod.toLocaleLowerCase()) {
      case 'first':
        return 'select'
      default:
        return sqlMethod.toLocaleLowerCase()
    }
  }

  const queryStartTime: Record<string, number> = {}

  new prometheusClient.Gauge({
    registers: [params.register],
    name: 'speckle_server_knex_free',
    help: 'Number of free DB connections',
    collect() {
      this.set(params.db.client.pool.numFree())
    }
  })

  new prometheusClient.Gauge({
    registers: [params.register],
    name: 'speckle_server_knex_used',
    help: 'Number of used DB connections',
    collect() {
      this.set(params.db.client.pool.numUsed())
    }
  })

  new prometheusClient.Gauge({
    registers: [params.register],
    name: 'speckle_server_knex_pending',
    help: 'Number of pending DB connection aquires',
    collect() {
      this.set(params.db.client.pool.numPendingAcquires())
    }
  })

  new prometheusClient.Gauge({
    registers: [params.register],
    name: 'speckle_server_knex_pending_creates',
    help: 'Number of pending DB connection creates',
    collect() {
      this.set(params.db.client.pool.numPendingCreates())
    }
  })

  new prometheusClient.Gauge({
    registers: [params.register],
    name: 'speckle_server_knex_pending_validations',
    help: 'Number of pending DB connection validations. This is a state between pending acquisition and acquiring a connection.',
    collect() {
      this.set(params.db.client.pool.numPendingValidations())
    }
  })

  new prometheusClient.Gauge({
    registers: [params.register],
    name: 'speckle_server_knex_remaining_capacity',
    help: 'Remaining capacity of the DB connection pool',
    collect() {
      this.set(numberOfFreeConnections(params.db))
    }
  })

  const metricQueryDuration = new prometheusClient.Summary({
    registers: [params.register],
    labelNames: ['sqlMethod'],
    name: 'speckle_server_knex_query_duration',
    help: 'Summary of the DB query durations in seconds'
  })

  const metricQueryErrors = new prometheusClient.Counter({
    registers: [params.register],
    labelNames: ['sqlMethod'],
    name: 'speckle_server_knex_query_errors',
    help: 'Number of DB queries with errors'
  })

  params.db.on('query', (data) => {
    const queryId = data.__knexQueryUid + ''
    queryStartTime[queryId] = performance.now()
  })

  params.db.on('query-response', (_data, querySpec) => {
    const queryId = querySpec.__knexQueryUid + ''
    const durationμs = performance.now() - queryStartTime[queryId]
    const durationSec = toNDecimalPlaces(durationμs / 1000 / 1000, 2)
    delete queryStartTime[queryId]
    if (!isNaN(durationSec))
      metricQueryDuration
        .labels({ sqlMethod: normalizeSqlMethods(querySpec.method) })
        .observe(durationSec)
    params.logger.debug(
      {
        sql: querySpec.sql,
        sqlMethod: normalizeSqlMethods(querySpec.method),
        queryId,
        sqlQueryDurationMs: Math.ceil(durationμs / 1000)
      },
      "DB query successfully completed, for method '{sqlMethod}', after {sqlQueryDurationMs}ms"
    )
  })

  params.db.on('query-error', (err, querySpec) => {
    const queryId = querySpec.__knexQueryUid + ''
    const durationμs = performance.now() - queryStartTime[queryId]
    const durationSec = toNDecimalPlaces(durationμs / 1000 / 1000, 2)
    delete queryStartTime[queryId]

    if (!isNaN(durationSec))
      metricQueryDuration
        .labels({ sqlMethod: normalizeSqlMethods(querySpec.method) })
        .observe(durationSec)
    metricQueryErrors.inc()
    params.logger.warn(
      {
        err,
        sql: querySpec.sql,
        sqlMethod: normalizeSqlMethods(querySpec.method),
        queryId,
        sqlQueryDurationMs: Math.ceil(durationμs / 1000)
      },
      'DB query errored for {sqlMethod} after {sqlQueryDurationMs}ms'
    )
  })
}
