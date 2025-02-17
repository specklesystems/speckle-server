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
  app: 'fileimport-service'
})
prometheusClient.collectDefaultMetrics()

let prometheusInitialized = false

const initDBPrometheusMetricsFactory =
  ({ db }) =>
  () => {
    metricFree = new prometheusClient.Gauge({
      name: 'speckle_server_knex_free',
      help: 'Number of free DB connections',
      collect() {
        this.set(db.client.pool.numFree())
      }
    })

    metricUsed = new prometheusClient.Gauge({
      name: 'speckle_server_knex_used',
      help: 'Number of used DB connections',
      collect() {
        this.set(db.client.pool.numUsed())
      }
    })

    metricPendingAquires = new prometheusClient.Gauge({
      name: 'speckle_server_knex_pending',
      help: 'Number of pending DB connection aquires',
      collect() {
        this.set(db.client.pool.numPendingAcquires())
      }
    })

    metricPendingCreates = new prometheusClient.Gauge({
      name: 'speckle_server_knex_pending_creates',
      help: 'Number of pending DB connection creates',
      collect() {
        this.set(db.client.pool.numPendingCreates())
      }
    })

    metricPendingValidations = new prometheusClient.Gauge({
      name: 'speckle_server_knex_pending_validations',
      help: 'Number of pending DB connection validations. This is a state between pending acquisition and acquiring a connection.',
      collect() {
        this.set(db.client.pool.numPendingValidations())
      }
    })

    metricRemainingCapacity = new prometheusClient.Gauge({
      name: 'speckle_server_knex_remaining_capacity',
      help: 'Remaining capacity of the DB connection pool',
      collect() {
        const postgresMaxConnections =
          parseInt(process.env.POSTGRES_MAX_CONNECTIONS_FILE_IMPORT_SERVICE) || 1
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

    db.on('query-response', (data, obj, builder) => {
      const queryId = obj.__knexQueryUid + ''
      const durationSec = (Date.now() - queryStartTime[queryId]) / 1000
      delete queryStartTime[queryId]
      if (!isNaN(durationSec)) metricQueryDuration.observe(durationSec)
    })

    db.on('query-error', (err, querySpec) => {
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

    const db = (await getDbClients()).main.public

    initDBPrometheusMetricsFactory({ db })()

    // Define the HTTP server
    const server = http.createServer(async (req, res) => {
      if (req.url === '/metrics') {
        res.setHeader('Content-Type', prometheusClient.register.contentType)
        res.end(await prometheusClient.register.metrics())
      } else {
        res.end('Speckle FileImport Service - prometheus metrics')
      }
    })
    server.listen(Number(process.env.PROMETHEUS_METRICS_PORT) || 9093)
  },

  metricDuration: new prometheusClient.Histogram({
    name: 'speckle_server_operation_duration',
    help: 'Summary of the operation durations in seconds',
    buckets: [0.5, 1, 5, 10, 30, 60, 300, 600, 900, 1200],
    labelNames: ['op']
  }),

  metricOperationErrors: new prometheusClient.Counter({
    name: 'speckle_server_operation_errors',
    help: 'Number of operations with errors',
    labelNames: ['op']
  }),

  metricInputFileSize: new prometheusClient.Histogram({
    name: 'speckle_server_operation_file_size',
    help: 'Size of the operation input file size',
    buckets: [
      1000,
      100 * 1000,
      500 * 1000,
      1000 * 1000,
      5 * 1000 * 1000,
      10 * 1000 * 1000,
      100 * 1000 * 1000
    ],
    labelNames: ['op']
  })
}
