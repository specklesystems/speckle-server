import prometheusClient, { type Registry } from 'prom-client'
import { numberOfFreeConnections } from '@/modules/shared/helpers/dbHelper'
import { type Knex } from 'knex'
import { Logger } from 'pino'
import { toNDecimalPlaces } from '@/modules/core/utils/formatting'
import { omit } from 'lodash'

export const initKnexPrometheusMetrics = (params: {
  db: Knex
  register: Registry
  logger: Logger
}) => {
  const normalizeSqlMethod = (sqlMethod: string) => {
    if (!sqlMethod) return 'unknown'
    switch (sqlMethod.toLocaleLowerCase()) {
      case 'first':
        return 'select'
      default:
        return sqlMethod.toLocaleLowerCase()
    }
  }

  const queryStartTime: Record<string, number> = {}
  const connectionAcquisitionStartTime: Record<string, number> = {}
  const connectionInUseStartTime: Record<string, number> = {}

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
    labelNames: ['sqlMethod', 'sqlNumberBindings'],
    name: 'speckle_server_knex_query_duration',
    help: 'Summary of the DB query durations in seconds'
  })

  const metricQueryErrors = new prometheusClient.Counter({
    registers: [params.register],
    labelNames: ['sqlMethod', 'sqlNumberBindings'],
    name: 'speckle_server_knex_query_errors',
    help: 'Number of DB queries with errors'
  })

  const metricConnectionAcquisitionDuration = new prometheusClient.Histogram({
    registers: [params.register],
    name: 'speckle_server_knex_connection_acquisition_duration',
    help: 'Summary of the DB connection acquisition duration, from request to acquire connection from pool until successfully acquired, in seconds'
  })

  const metricConnectionPoolErrors = new prometheusClient.Counter({
    registers: [params.register],
    name: 'speckle_server_knex_connection_acquisition_errors',
    help: 'Number of DB connection pool acquisition errors'
  })

  const metricConnectionInUseDuration = new prometheusClient.Histogram({
    registers: [params.register],
    name: 'speckle_server_knex_connection_usage_duration',
    help: 'Summary of the DB connection duration, from successful acquisition of connection from pool until release back to pool, in seconds'
  })

  const metricConnectionPoolReapingDuration = new prometheusClient.Histogram({
    registers: [params.register],
    name: 'speckle_server_knex_connection_pool_reaping_duration',
    help: 'Summary of the DB connection pool reaping duration, in seconds. Reaping is the process of removing idle connections from the pool.'
  })

  // configure hooks on knex

  params.db.on('query', (data) => {
    const queryId = data.__knexQueryUid + ''
    queryStartTime[queryId] = performance.now()
  })

  params.db.on('query-response', (_data, querySpec) => {
    const queryId = querySpec.__knexQueryUid + ''
    const durationMs = performance.now() - queryStartTime[queryId]
    const durationSec = toNDecimalPlaces(durationMs / 1000, 2)
    delete queryStartTime[queryId]
    if (!isNaN(durationSec))
      metricQueryDuration
        .labels({
          sqlMethod: normalizeSqlMethod(querySpec.method),
          sqlNumberBindings: querySpec.bindings?.length || -1
        })
        .observe(durationSec)
    params.logger.debug(
      {
        sql: querySpec.sql,
        sqlMethod: normalizeSqlMethod(querySpec.method),
        sqlQueryId: queryId,
        sqlQueryDurationMs: toNDecimalPlaces(durationMs, 0),
        sqlNumberBindings: querySpec.bindings?.length || -1
      },
      "DB query successfully completed, for method '{sqlMethod}', after {sqlQueryDurationMs}ms"
    )
  })

  params.db.on('query-error', (err, querySpec) => {
    const queryId = querySpec.__knexQueryUid + ''
    const durationMs = performance.now() - queryStartTime[queryId]
    const durationSec = toNDecimalPlaces(durationMs / 1000, 2)
    delete queryStartTime[queryId]

    if (!isNaN(durationSec))
      metricQueryDuration
        .labels({
          sqlMethod: normalizeSqlMethod(querySpec.method),
          sqlNumberBindings: querySpec.bindings?.length || -1
        })
        .observe(durationSec)
    metricQueryErrors.inc()
    params.logger.warn(
      {
        err: omit(err, 'detail'),
        sql: querySpec.sql,
        sqlMethod: normalizeSqlMethod(querySpec.method),
        sqlQueryId: queryId,
        sqlQueryDurationMs: toNDecimalPlaces(durationMs, 0),
        sqlNumberBindings: querySpec.bindings?.length || -1
      },
      'DB query errored for {sqlMethod} after {sqlQueryDurationMs}ms'
    )
  })

  const pool = params.db.client.pool

  // configure hooks on knex connection pool
  pool.on('acquireRequest', (eventId: number) => {
    connectionAcquisitionStartTime[eventId] = performance.now()
    // params.logger.debug(
    //   {
    //     eventId
    //   },
    //   'DB connection acquisition request occurred.'
    // )
  })
  pool.on('acquireSuccess', (eventId: number, resource: unknown) => {
    const now = performance.now()
    const durationMs = now - connectionAcquisitionStartTime[eventId]
    delete connectionAcquisitionStartTime[eventId]
    if (!isNaN(durationMs)) metricConnectionAcquisitionDuration.observe(durationMs)

    // successful acquisition is the start of usage, so record that start time
    let knexUid: string | undefined = undefined
    if (resource && typeof resource === 'object' && '__knexUid' in resource) {
      const _knexUid = resource['__knexUid']
      if (_knexUid && typeof _knexUid === 'string') {
        knexUid = _knexUid
        connectionInUseStartTime[knexUid] = now
      }
    }

    // params.logger.debug(
    //   {
    //     eventId,
    //     knexUid,
    //     connectionAcquisitionDurationMs: toNDecimalPlaces(durationMs, 0)
    //   },
    //   'DB connection (knexUid: {knexUid}) acquired after {connectionAcquisitionDurationMs}ms'
    // )
  })
  pool.on('acquireFail', (eventId: number, err: unknown) => {
    const now = performance.now()
    const durationMs = now - connectionAcquisitionStartTime[eventId]
    delete connectionAcquisitionStartTime[eventId]
    metricConnectionPoolErrors.inc()
    params.logger.warn(
      {
        err,
        eventId,
        connectionAcquisitionDurationMs: toNDecimalPlaces(durationMs, 0)
      },
      'DB connection acquisition failed after {connectionAcquisitionDurationMs}ms'
    )
  })

  // resource returned to pool
  pool.on('release', (resource: unknown) => {
    if (!(resource && typeof resource === 'object' && '__knexUid' in resource)) return
    const knexUid = resource['__knexUid']
    if (!knexUid || typeof knexUid !== 'string') return

    const now = performance.now()
    const durationMs = now - connectionInUseStartTime[knexUid]
    if (!isNaN(durationMs)) metricConnectionInUseDuration.observe(durationMs)
    // params.logger.debug(
    //   {
    //     knexUid,
    //     connectionInUseDurationMs: toNDecimalPlaces(durationMs, 0)
    //   },
    //   'DB connection (knexUid: {knexUid}) released after {connectionInUseDurationMs}ms'
    // )
  })

  // resource was created and added to the pool
  // pool.on('createRequest', (eventId) => {})
  // pool.on('createSuccess', (eventId, resource) => {})
  // pool.on('createFail', (eventId, err) => {})

  // resource is destroyed and evicted from pool
  // resource may or may not be invalid when destroySuccess / destroyFail is called
  // pool.on('destroyRequest', (eventId, resource) => {})
  // pool.on('destroySuccess', (eventId, resource) => {})
  // pool.on('destroyFail', (eventId, resource, err) => {})

  // when internal reaping event clock is activated / deactivated
  let reapingStartTime: number | undefined = undefined
  pool.on('startReaping', () => {
    reapingStartTime = performance.now()
  })
  pool.on('stopReaping', () => {
    if (!reapingStartTime) return
    const durationMs = performance.now() - reapingStartTime
    if (!isNaN(durationMs)) metricConnectionPoolReapingDuration.observe(durationMs)
    reapingStartTime = undefined
  })

  // pool is destroyed (after poolDestroySuccess all event handlers are also cleared)
  // pool.on('poolDestroyRequest', (eventId) => {})
  // pool.on('poolDestroySuccess', (eventId) => {})
}
