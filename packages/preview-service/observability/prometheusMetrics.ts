import prometheusClient from 'prom-client'
import type { Counter, Histogram, Summary } from 'prom-client'
import knex from '../repositories/knex'
import { logger } from './logging'

// let metricFree: Gauge<string> | null = null
// let metricUsed: Gauge<string> = null
// let metricPendingAquires: Gauge<string> | null = null
let metricQueryDuration: Summary<string> | null = null
let metricQueryErrors: Counter<string> | null = null
export let metricDuration: Histogram<string> | null = null
export let metricOperationErrors: Counter<string> | null = null

const queryStartTime: Record<string, number> = {}
prometheusClient.register.clear()
prometheusClient.register.setDefaultLabels({
  project: 'speckle-server',
  app: 'preview-service'
})
prometheusClient.collectDefaultMetrics()

let prometheusInitialized = false

function isPrometheusInitialized() {
  return prometheusInitialized
}

function initKnexPrometheusMetrics() {
  //metricFree =
  new prometheusClient.Gauge({
    name: 'speckle_server_knex_free',
    help: 'Number of free DB connections',
    collect() {
      this.set(knex.client.pool.numFree())
    }
  })

  //metricUsed =
  new prometheusClient.Gauge({
    name: 'speckle_server_knex_used',
    help: 'Number of used DB connections',
    collect() {
      this.set(knex.client.pool.numUsed())
    }
  })

  //metricPendingAquires =
  new prometheusClient.Gauge({
    name: 'speckle_server_knex_pending',
    help: 'Number of pending DB connection aquires',
    collect() {
      this.set(knex.client.pool.numPendingAcquires())
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

  knex.on('query', (data) => {
    const queryId = data.__knexQueryUid + ''
    queryStartTime[queryId] = Date.now()
  })

  knex.on('query-response', (_data, obj) => {
    const queryId = obj.__knexQueryUid + ''
    const durationSec = (Date.now() - queryStartTime[queryId]) / 1000
    delete queryStartTime[queryId]
    if (metricQueryDuration && !isNaN(durationSec))
      metricQueryDuration.observe(durationSec)
  })

  knex.on('query-error', (_err, querySpec) => {
    const queryId = querySpec.__knexQueryUid + ''
    const durationSec = (Date.now() - queryStartTime[queryId]) / 1000
    delete queryStartTime[queryId]

    if (metricQueryDuration && !isNaN(durationSec))
      metricQueryDuration.observe(durationSec)

    if (metricQueryErrors) metricQueryErrors.inc()
  })
}

export function initPrometheusMetrics() {
  logger.info('Initializing Prometheus metrics...')
  if (isPrometheusInitialized()) {
    logger.info('Prometheus metrics already initialized')
    return
  }

  prometheusInitialized = true

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

    initKnexPrometheusMetrics()
  } catch {
    prometheusInitialized = false
  }
}
