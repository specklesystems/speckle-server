/* istanbul ignore file */
const Sentry = require('@sentry/node')
const Tracing = require('@sentry/tracing')
const { machineIdSync } = require('node-machine-id')
const prometheusClient = require('prom-client')

const { createRequestDurationMiddleware } = require('./expressMonitoring')
const { initKnexPrometheusMetrics } = require('./knexMonitoring')

let prometheusInitialized = false

module.exports = function (app) {
  const id = machineIdSync()

  if (!prometheusInitialized) {
    prometheusInitialized = true
    prometheusClient.register.clear()
    prometheusClient.register.setDefaultLabels({
      project: 'speckle-server',
      app: 'server'
    })
    prometheusClient.collectDefaultMetrics()

    initKnexPrometheusMetrics()
  }

  app.use(createRequestDurationMiddleware())

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
