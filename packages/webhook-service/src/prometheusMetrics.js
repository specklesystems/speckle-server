/* eslint-disable no-unused-vars */
'use strict'

const http = require('http')
const prometheusClient = require('prom-client')
const knex = require('./knex')

let metricFree = null
let metricUsed = null
let metricPendingAquires = null
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

function initKnexPrometheusMetrics() {
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
  initPrometheusMetrics() {
    if (prometheusInitialized) return
    prometheusInitialized = true

    initKnexPrometheusMetrics()

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
