/* istanbul ignore file */
/* eslint-disable no-unused-vars */
'use strict'

const knex = require('../db/knex')
const prometheusClient = require('prom-client')

let metricFree = null
let metricUsed = null
let metricPendingCreates = null
let metricPendingValidations = null
let metricRemainingCapacity = null
let metricPendingAquires = null
let metricQueryDuration = null
let metricQueryErrors = null

const queryStartTime = {}
const postgresMaxConnections =
  parseInt(process.env.POSTGRES_MAX_CONNECTIONS_SERVER) || 4

module.exports = {
  initKnexPrometheusMetrics() {
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
          parseInt(process.env.POSTGRES_MAX_CONNECTIONS_SERVER) || 4
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
}
