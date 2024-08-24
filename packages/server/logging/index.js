/* istanbul ignore file */
const prometheusClient = require('prom-client')
const promBundle = require('express-prom-bundle')

const { initKnexPrometheusMetrics } = require('@/logging/knexMonitoring')
const {
  initHighFrequencyMonitoring
} = require('@/logging/highFrequencyMetrics/highfrequencyMonitoring')
const knex = require('@/db/knex')
const {
  highFrequencyMetricsCollectionPeriodMs
} = require('@/modules/shared/helpers/envHelper')
const { startupLogger: logger } = require('@/logging/logging')

let prometheusInitialized = false

module.exports = function (app) {
  if (!prometheusInitialized) {
    prometheusInitialized = true
    prometheusClient.register.clear()
    prometheusClient.register.setDefaultLabels({
      project: 'speckle-server',
      app: 'server'
    })
    prometheusClient.collectDefaultMetrics()
    const highfrequencyMonitoring = initHighFrequencyMonitoring({
      register: prometheusClient.register,
      collectionPeriodMilliseconds: highFrequencyMetricsCollectionPeriodMs(),
      config: {
        knex
      }
    })
    highfrequencyMonitoring.start()

    initKnexPrometheusMetrics({
      register: prometheusClient.register,
      db: knex,
      logger
    })
    const expressMetricsMiddleware = promBundle({
      includeMethod: true,
      includePath: true,
      httpDurationMetricName: 'speckle_server_request_duration',
      metricType: 'summary',
      autoregister: false
    })

    app.use(expressMetricsMiddleware)
  }
}
