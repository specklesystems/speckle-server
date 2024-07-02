import prometheusClient from 'prom-client'
import type { Counter, Histogram, Summary } from 'prom-client'
import { logger } from '@/observability/logging'
import type { Knex } from 'knex'
import { getPostgresMaxConnections } from '@/utils/env'

// let metricFree: Gauge<string> | null = null
// let metricUsed: Gauge<string> = null
// let metricPendingAquires: Gauge<string> | null = null
let metricQueryDuration: Summary<string> | null = null
let metricQueryErrors: Counter<string> | null = null
export let metricDuration: Histogram<string> | null = null
export let metricOperationErrors: Counter<string> | null = null

let prometheusInitialized = false

function isPrometheusInitialized() {
  return prometheusInitialized
}

function initKnexPrometheusMetrics(params: { db: Knex }) {
  const queryStartTime: Record<string, number> = {}
  const { db } = params
  //metricFree =
  new prometheusClient.Gauge({
    name: 'speckle_server_knex_free',
    help: 'Number of free DB connections',
    collect() {
      this.set(db.client.pool.numFree())
    }
  })

  //metricUsed =
  new prometheusClient.Gauge({
    name: 'speckle_server_knex_used',
    help: 'Number of used DB connections',
    collect() {
      this.set(db.client.pool.numUsed())
    }
  })

  //metricPendingAquires =
  new prometheusClient.Gauge({
    name: 'speckle_server_knex_pending',
    help: 'Number of pending DB connection aquires',
    collect() {
      this.set(db.client.pool.numPendingAcquires())
    }
  })

  //metricPendingCreates =
  new prometheusClient.Gauge({
    name: 'speckle_server_knex_pending_creates',
    help: 'Number of pending DB connection creates',
    collect() {
      this.set(db.client.pool.numPendingCreates())
    }
  })

  //metricPendingValidations =
  new prometheusClient.Gauge({
    name: 'speckle_server_knex_pending_validations',
    help: 'Number of pending DB connection validations. This is a state between pending acquisition and acquiring a connection.',
    collect() {
      this.set(db.client.pool.numPendingValidations())
    }
  })

  //metricRemainingCapacity =
  new prometheusClient.Gauge({
    name: 'speckle_server_knex_remaining_capacity',
    help: 'Remaining capacity of the DB connection pool',
    collect() {
      const postgresMaxConnections = getPostgresMaxConnections()
      const demand =
        db.client.pool.numUsed() +
        db.client.pool.numPendingCreates() +
        db.client.pool.numPendingValidations() +
        db.client.pool.numPendingAcquires()

      this.set(Math.max(postgresMaxConnections - demand, 0))
    }
  })

  metricQueryDuration = new prometheusClient.Summary({
    name: 'speckle_server_knex_query_duration',
    help: 'Summary of the DB query durations in seconds'
  })

  metricQueryErrors = new prometheusClient.Counter({
    name: 'speckle_server_knex_query_errors',
    help: 'Number of DB queries with errors'
  })

  db.on('query', (data) => {
    const queryId = data.__knexQueryUid + ''
    queryStartTime[queryId] = Date.now()
  })

  db.on('query-response', (_data, obj) => {
    const queryId = obj.__knexQueryUid + ''
    const durationSec = (Date.now() - queryStartTime[queryId]) / 1000
    delete queryStartTime[queryId]
    if (metricQueryDuration && !isNaN(durationSec))
      metricQueryDuration.observe(durationSec)
  })

  db.on('query-error', (_err, querySpec) => {
    const queryId = querySpec.__knexQueryUid + ''
    const durationSec = (Date.now() - queryStartTime[queryId]) / 1000
    delete queryStartTime[queryId]

    if (metricQueryDuration && !isNaN(durationSec))
      metricQueryDuration.observe(durationSec)

    if (metricQueryErrors) metricQueryErrors.inc()
  })
}

export function initPrometheusMetrics(params: { db: Knex }) {
  logger.info('Initializing Prometheus metrics...')
  if (isPrometheusInitialized()) {
    logger.info('Prometheus metrics already initialized')
    return
  }

  prometheusInitialized = true

  prometheusClient.register.clear()
  prometheusClient.register.setDefaultLabels({
    project: 'speckle-server',
    app: 'preview-service'
  })

  try {
    metricDuration = new prometheusClient.Histogram({
      name: 'speckle_server_operation_duration',
      help: 'Summary of the operation durations in seconds',
      buckets: [0.5, 1, 5, 10, 30, 60, 300, 600, 1200, 1800],
      labelNames: ['op']
    })

    metricOperationErrors = new prometheusClient.Counter({
      name: 'speckle_server_operation_errors',
      help: 'Number of operations with errors',
      labelNames: ['op']
    })

    initKnexPrometheusMetrics(params)
    prometheusClient.collectDefaultMetrics()
  } catch (e) {
    logger.error(e, 'Failed to initialize Prometheus metrics.')
    prometheusInitialized = false
  }
}
