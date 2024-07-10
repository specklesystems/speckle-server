/* istanbul ignore file */
const Sentry = require('@sentry/node')
const Tracing = require('@sentry/tracing')
const { getMachineId } = require('./machineId')
const prometheusClient = require('prom-client')
const promBundle = require('express-prom-bundle')

const { initKnexPrometheusMetrics } = require('@/logging/knexMonitoring')
const {
  initHighFrequencyMonitoring
} = require('@/logging/highFrequencyMetrics/highfrequencyMonitoring')

let prometheusInitialized = false

module.exports = function (app) {
  const id = getMachineId()

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
      collectionPeriodMilliseconds: 100
    })
    highfrequencyMonitoring.start()

    initKnexPrometheusMetrics()
    const expressMetricsMiddleware = promBundle({
      includeMethod: true,
      includePath: true,
      httpDurationMetricName: 'speckle_server_request_duration',
      metricType: 'summary',
      autoregister: false
    })

    app.use(expressMetricsMiddleware)
  }

  if (process.env.DISABLE_TRACING !== 'true' && process.env.SENTRY_DSN) {
    Sentry.setUser({ id })

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Tracing.Integrations.Express({ app })
      ],
      tracesSampleRate: 0.1
    })

    app.use(Sentry.Handlers.requestHandler())
    app.use(Sentry.Handlers.tracingHandler())
  }
}
