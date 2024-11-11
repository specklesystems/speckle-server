/* eslint-disable no-unused-vars */
'use strict'

const http = require('http')
const prometheusClient = require('prom-client')
const getDbClients = require('../knex')

let metricFree = null
let metricUsed = null
let metricPendingAquires = null
let metricPendingCreates = null
let metricPendingValidations = null
let metricRemainingCapacity = null
let metricQueryDuration = null
let metricQueryErrors = null

const queryStartTime = {}
prometheusClient.register.clear()
prometheusClient.register.setDefaultLabels({
  project: 'speckle-server',
  app: 'webhook-service'
})
prometheusClient.collectDefaultMetrics()

let prometheusInitialized = false

async function initKnexPrometheusMetrics() {
  const knex = (await getDbClients()).main.public
  metricFree = new prometheusClient.Gauge({
    name: 'speckle_server_knex_free',
    help: 'Number of free DB connections',
    collect() {
      this.set(knex.client.pool.numFree())
    }
  })

  metricUsed = new prometheusClient.Gauge({
    name: 'speckle_server_knex_used',
    help: 'Number of used DB connections',
    collect() {
      this.set(knex.client.pool.numUsed())
    }
  })

  metricPendingAquires = new prometheusClient.Gauge({
    name: 'speckle_server_knex_pending',
    help: 'Number of pending DB connection aquires',
    collect() {
      this.set(knex.client.pool.numPendingAcquires())
    }
  })

  metricPendingCreates = new prometheusClient.Gauge({
    name: 'speckle_server_knex_pending_creates',
    help: 'Number of pending DB connection creates',
    collect() {
      this.set(knex.client.pool.numPendingCreates())
    }
  })

  metricPendingValidations = new prometheusClient.Gauge({
    name: 'speckle_server_knex_pending_validations',
    help: 'Number of pending DB connection validations. This is a state between pending acquisition and acquiring a connection.',
    collect() {
      this.set(knex.client.pool.numPendingValidations())
    }
  })

  metricRemainingCapacity = new prometheusClient.Gauge({
    name: 'speckle_server_knex_remaining_capacity',
    help: 'Remaining capacity of the DB connection pool',
    collect() {
      const postgresMaxConnections =
        parseInt(process.env.POSTGRES_MAX_CONNECTIONS_WEBHOOK_SERVICE) || 1
      const demand =
        knex.client.pool.numUsed() +
        knex.client.pool.numPendingCreates() +
        knex.client.pool.numPendingValidations() +
        knex.client.pool.numPendingAcquires()

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

  knex.on('query', (data) => {
    const queryId = data.__knexQueryUid + ''
    queryStartTime[queryId] = Date.now()
  })

  knex.on('query-response', (data, obj, builder) => {
    const queryId = obj.__knexQueryUid + ''
    const durationSec = (Date.now() - queryStartTime[queryId]) / 1000
    delete queryStartTime[queryId]
    if (!isNaN(durationSec)) metricQueryDuration.observe(durationSec)
  })

  knex.on('query-error', (err, querySpec) => {
    const queryId = querySpec.__knexQueryUid + ''
    const durationSec = (Date.now() - queryStartTime[queryId]) / 1000
    delete queryStartTime[queryId]

    if (!isNaN(durationSec)) metricQueryDuration.observe(durationSec)
    metricQueryErrors.inc()
  })
}

module.exports = {
  async initPrometheusMetrics() {
    if (prometheusInitialized) return
    prometheusInitialized = true

    await initKnexPrometheusMetrics()

    // Define the HTTP server
    const server = http.createServer(async (req, res) => {
      if (req.url === '/metrics') {
        res.setHeader('Content-Type', prometheusClient.register.contentType)
        res.end(await prometheusClient.register.metrics())
      } else {
        res.end('Speckle Webhook Service - prometheus metrics')
      }
    })
    server.listen(Number(process.env.PROMETHEUS_METRICS_PORT) || 9095)
  },

  metricDuration: new prometheusClient.Histogram({
    name: 'speckle_server_operation_duration',
    help: 'Summary of the operation durations in seconds',
    buckets: [0.5, 1, 5, 10, 30, 60, 300, 600],
    labelNames: ['op']
  }),

  metricOperationErrors: new prometheusClient.Counter({
    name: 'speckle_server_operation_errors',
    help: 'Number of operations with errors',
    labelNames: ['op']
  })
}
