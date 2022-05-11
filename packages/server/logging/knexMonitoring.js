/* istanbul ignore file */
/* eslint-disable no-unused-vars */
'use strict'

const knex = require('../db/knex')
const prometheusClient = require('prom-client')

let metricFree = null
let metricUsed = null
let metricPendingAquires = null
let metricQueryDuration = null
let metricQueryErrors = null

const queryStartTime = {}

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
