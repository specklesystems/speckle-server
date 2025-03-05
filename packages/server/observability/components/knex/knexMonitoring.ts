import { type Registry, Summary, Counter, Gauge, Histogram } from 'prom-client'
import { numberOfFreeConnections } from '@/modules/shared/helpers/dbHelper'
import { type Knex } from 'knex'
import { Logger } from 'pino'
import { toNDecimalPlaces } from '@/modules/core/utils/formatting'
import { omit } from 'lodash'
import { getRequestContext } from '@/observability/components/express/requestContext'
import { collectLongTrace } from '@speckle/shared'

let metricQueryDuration: Summary<string>
let metricQueryErrors: Counter<string>
let metricConnectionAcquisitionDuration: Histogram<string>
let metricConnectionPoolErrors: Counter<string>
let metricConnectionInUseDuration: Histogram<string>
let metricConnectionPoolReapingDuration: Histogram<string>
const initializedRegions: string[] = []
let initializedPollingMetrics = false

export const initKnexPrometheusMetrics = async (params: {
  getAllDbClients: () => Promise<
    Array<{ client: Knex; isMain: boolean; regionKey: string }>
  >
  registers: Registry[]
  logger: Logger
}) => {
  const { registers } = params
  if (!initializedPollingMetrics) {
    initializedPollingMetrics = true

    registers.forEach((r) => r.removeSingleMetric('speckle_server_knex_free'))
    new Gauge({
      registers,
      name: 'speckle_server_knex_free',
      labelNames: ['region'],
      help: 'Number of free DB connections',
      async collect() {
        for (const dbClient of await params.getAllDbClients()) {
          this.set(
            { region: dbClient.regionKey },
            dbClient.client.client.pool.numFree()
          )
        }
      }
    })

    registers.forEach((r) => r.removeSingleMetric('speckle_server_knex_used'))
    new Gauge({
      registers,
      name: 'speckle_server_knex_used',
      labelNames: ['region'],
      help: 'Number of used DB connections',
      async collect() {
        for (const dbClient of await params.getAllDbClients()) {
          this.set(
            { region: dbClient.regionKey },
            dbClient.client.client.pool.numUsed()
          )
        }
      }
    })

    registers.forEach((r) => r.removeSingleMetric('speckle_server_knex_pending'))
    new Gauge({
      registers,
      name: 'speckle_server_knex_pending',
      labelNames: ['region'],
      help: 'Number of pending DB connection aquires',
      async collect() {
        for (const dbClient of await params.getAllDbClients()) {
          this.set(
            { region: dbClient.regionKey },
            dbClient.client.client.pool.numPendingAcquires()
          )
        }
      }
    })

    registers.forEach((r) =>
      r.removeSingleMetric('speckle_server_knex_pending_creates')
    )
    new Gauge({
      registers,
      name: 'speckle_server_knex_pending_creates',
      labelNames: ['region'],
      help: 'Number of pending DB connection creates',
      async collect() {
        for (const dbClient of await params.getAllDbClients()) {
          this.set(
            { region: dbClient.regionKey },
            dbClient.client.client.pool.numPendingCreates()
          )
        }
      }
    })

    registers.forEach((r) =>
      r.removeSingleMetric('speckle_server_knex_pending_validations')
    )
    new Gauge({
      registers,
      name: 'speckle_server_knex_pending_validations',
      labelNames: ['region'],
      help: 'Number of pending DB connection validations. This is a state between pending acquisition and acquiring a connection.',
      async collect() {
        for (const dbClient of await params.getAllDbClients()) {
          this.set(
            { region: dbClient.regionKey },
            dbClient.client.client.pool.numPendingValidations()
          )
        }
      }
    })

    registers.forEach((r) =>
      r.removeSingleMetric('speckle_server_knex_remaining_capacity')
    )
    new Gauge({
      registers,
      name: 'speckle_server_knex_remaining_capacity',
      labelNames: ['region'],
      help: 'Remaining capacity of the DB connection pool',
      async collect() {
        for (const dbClient of await params.getAllDbClients()) {
          this.set(
            { region: dbClient.regionKey },
            numberOfFreeConnections(dbClient.client)
          )
        }
      }
    })

    registers.forEach((r) => r.removeSingleMetric('speckle_server_knex_query_duration'))
    metricQueryDuration = new Summary({
      registers,
      labelNames: ['sqlMethod', 'sqlNumberBindings', 'region'],
      name: 'speckle_server_knex_query_duration',
      help: 'Summary of the DB query durations in seconds'
    })

    registers.forEach((r) => r.removeSingleMetric('speckle_server_knex_query_errors'))
    metricQueryErrors = new Counter({
      registers,
      labelNames: ['sqlMethod', 'sqlNumberBindings', 'region'],
      name: 'speckle_server_knex_query_errors',
      help: 'Number of DB queries with errors'
    })

    registers.forEach((r) =>
      r.removeSingleMetric('speckle_server_knex_connection_acquisition_duration')
    )
    metricConnectionAcquisitionDuration = new Histogram({
      registers,
      name: 'speckle_server_knex_connection_acquisition_duration',
      labelNames: ['region'],
      help: 'Summary of the DB connection acquisition duration, from request to acquire connection from pool until successfully acquired, in seconds'
    })

    registers.forEach((r) =>
      r.removeSingleMetric('speckle_server_knex_connection_acquisition_errors')
    )
    metricConnectionPoolErrors = new Counter({
      registers,
      name: 'speckle_server_knex_connection_acquisition_errors',
      labelNames: ['region'],
      help: 'Number of DB connection pool acquisition errors'
    })

    registers.forEach((r) =>
      r.removeSingleMetric('speckle_server_knex_connection_usage_duration')
    )
    metricConnectionInUseDuration = new Histogram({
      registers,
      name: 'speckle_server_knex_connection_usage_duration',
      labelNames: ['region'],
      help: 'Summary of the DB connection duration, from successful acquisition of connection from pool until release back to pool, in seconds'
    })

    registers.forEach((r) =>
      r.removeSingleMetric('speckle_server_knex_connection_pool_reaping_duration')
    )
    metricConnectionPoolReapingDuration = new Histogram({
      registers,
      name: 'speckle_server_knex_connection_pool_reaping_duration',
      labelNames: ['region'],
      help: 'Summary of the DB connection pool reaping duration, in seconds. Reaping is the process of removing idle connections from the pool.'
    })
  }

  // configure hooks on knex
  for (const dbClient of await params.getAllDbClients()) {
    if (initializedRegions.includes(dbClient.regionKey)) continue
    initKnexPrometheusMetricsForRegionEvents({
      logger: params.logger,
      region: dbClient.regionKey,
      db: dbClient.client
    })
    initializedRegions.push(dbClient.regionKey)
  }
}

const normalizeSqlMethod = (sqlMethod: string) => {
  if (!sqlMethod) return 'unknown'
  switch (sqlMethod.toLocaleLowerCase()) {
    case 'first':
      return 'select'
    default:
      return sqlMethod.toLocaleLowerCase()
  }
}

interface QueryEvent extends Knex.Sql {
  __knexUid: string
  __knexTxId: string
  __knexQueryUid: string
  __stackTrace: string
}

const initKnexPrometheusMetricsForRegionEvents = async (params: {
  region: string
  db: Knex
  logger: Logger
}) => {
  const { region, db } = params
  const queryMetadata: Record<string, { startTime: number; stackTrace: string }> = {}
  const connectionAcquisitionStartTime: Record<string, number> = {}
  const connectionInUseStartTime: Record<string, number> = {}

  db.on('query', (data: QueryEvent) => {
    const queryId = data.__knexQueryUid + ''
    queryMetadata[queryId] = {
      startTime: performance.now(),
      stackTrace: data.__stackTrace
    }
  })

  db.on('query-response', (_response: unknown, data: QueryEvent) => {
    const queryId = data.__knexQueryUid + ''
    const { startTime = NaN, stackTrace = undefined } = queryMetadata[queryId] || {}

    const durationMs = performance.now() - startTime
    const durationSec = toNDecimalPlaces(durationMs / 1000, 2)
    delete queryMetadata[queryId]
    if (!isNaN(durationSec))
      metricQueryDuration
        .labels({
          region,
          sqlMethod: normalizeSqlMethod(data.method),
          sqlNumberBindings: data.bindings?.length || -1
        })
        .observe(durationSec)

    const reqCtx = getRequestContext()

    // Update reqCtx with DB query metrics
    if (reqCtx) {
      reqCtx.dbMetrics.totalCount++
      reqCtx.dbMetrics.totalDuration += durationMs || 0
    }

    const trace = stackTrace || collectLongTrace()
    params.logger.info(
      {
        region,
        sql: data.sql,
        sqlMethod: normalizeSqlMethod(data.method),
        sqlQueryId: queryId,
        sqlQueryDurationMs: toNDecimalPlaces(durationMs, 0),
        sqlNumberBindings: data.bindings?.length || -1,
        trace,
        ...(reqCtx ? { req: { id: reqCtx.requestId } } : {})
      },
      'DB query successfully completed after {sqlQueryDurationMs} ms'
    )
  })

  db.on('query-error', (err: unknown, data: QueryEvent) => {
    const queryId = data.__knexQueryUid + ''
    const { startTime = NaN, stackTrace = undefined } = queryMetadata[queryId] || {}

    const durationMs = performance.now() - startTime
    const durationSec = toNDecimalPlaces(durationMs / 1000, 2)
    delete queryMetadata[queryId]

    if (!isNaN(durationSec))
      metricQueryDuration
        .labels({
          region,
          sqlMethod: normalizeSqlMethod(data.method),
          sqlNumberBindings: data.bindings?.length || -1
        })
        .observe(durationSec)
    metricQueryErrors.inc()

    const reqCtx = getRequestContext()

    // Update reqCtx with DB query metrics
    if (reqCtx) {
      reqCtx.dbMetrics.totalCount++
      reqCtx.dbMetrics.totalDuration += durationMs || 0
    }

    const trace = stackTrace || collectLongTrace()
    params.logger.warn(
      {
        err: typeof err === 'object' ? omit(err, 'detail') : err,
        region,
        sql: data.sql,
        sqlMethod: normalizeSqlMethod(data.method),
        sqlQueryId: queryId,
        sqlQueryDurationMs: toNDecimalPlaces(durationMs, 0),
        sqlNumberBindings: data.bindings?.length || -1,
        trace,
        ...(reqCtx ? { req: { id: reqCtx.requestId } } : {})
      },
      'DB query errored for {sqlMethod} after {sqlQueryDurationMs}ms'
    )
  })

  const pool = db.client.pool

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
    if (!isNaN(durationMs))
      metricConnectionAcquisitionDuration.labels({ region }).observe(durationMs)

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
    if (!isNaN(durationMs))
      metricConnectionInUseDuration.labels({ region }).observe(durationMs)
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
    if (!isNaN(durationMs))
      metricConnectionPoolReapingDuration.labels({ region }).observe(durationMs)
    reapingStartTime = undefined
  })

  // pool is destroyed (after poolDestroySuccess all event handlers are also cleared)
  // pool.on('poolDestroyRequest', (eventId) => {})
  // pool.on('poolDestroySuccess', (eventId) => {})
}
