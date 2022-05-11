/* istanbul ignore file */
'use strict'

require('./bootstrap')
const http = require('http')
const express = require('express')
// `express-async-errors` patches express to catch errors in async handlers. no variable needed
require('express-async-errors')
const compression = require('compression')
const logger = require('morgan-debug')
const bodyParser = require('body-parser')
const debug = require('debug')
const { createTerminus } = require('@godaddy/terminus')

const Sentry = require('@sentry/node')
const Logging = require('@/logging')
const { errorLoggingMiddleware } = require('@/logging/errorLogging')
const prometheusClient = require('prom-client')

const { ApolloServer, ForbiddenError } = require('apollo-server-express')

const { buildContext } = require('./modules/shared')
const knex = require('./db/knex')
const { monitorActiveConnections } = require('./logging/httpServerMonitoring')
const { buildErrorFormatter } = require('@/modules/core/graph/setup')
const { isDevEnv, isTestEnv } = require('@/modules/core/helpers/envHelper')

let graphqlServer

/**
 * Create Apollo Server instance
 * @param {Partial<import('apollo-server-express').ApolloServerExpressConfig>} optionOverrides Optionally override ctor options
 * @returns {import('apollo-server-express').ApolloServer}
 */
exports.buildApolloServer = (optionOverrides) => {
  const debug = optionOverrides?.debug || isDevEnv() || isTestEnv()
  const { graph } = require('./modules')

  // Init metrics
  prometheusClient.register.removeSingleMetric('speckle_server_apollo_connect')
  const metricConnectCounter = new prometheusClient.Counter({
    name: 'speckle_server_apollo_connect',
    help: 'Number of connects'
  })
  prometheusClient.register.removeSingleMetric('speckle_server_apollo_clients')
  const metricConnectedClients = new prometheusClient.Gauge({
    name: 'speckle_server_apollo_clients',
    help: 'Number of currently connected clients'
  })

  return new ApolloServer({
    ...graph(),
    context: buildContext,
    subscriptions: {
      onConnect: (connectionParams) => {
        metricConnectCounter.inc()
        metricConnectedClients.inc()
        try {
          if (
            connectionParams.Authorization ||
            connectionParams.authorization ||
            connectionParams.headers.Authorization
          ) {
            const header =
              connectionParams.Authorization ||
              connectionParams.authorization ||
              connectionParams.headers.Authorization
            const token = header.split(' ')[1]
            return { token }
          }
        } catch (e) {
          throw new ForbiddenError('You need a token to subscribe')
        }
      },
      onDisconnect: () => {
        metricConnectedClients.dec()
      }
    },
    plugins: [require('@/logging/apolloPlugin')],
    tracing: debug,
    introspection: true,
    playground: true,
    formatError: buildErrorFormatter(debug),
    debug,
    ...optionOverrides
  })
}

/**
 * Initialises the express application together with the graphql server middleware.
 */
exports.init = async () => {
  const app = express()

  Logging(app)

  // Moves things along automatically on restart.
  // Should perhaps be done manually?
  await knex.migrate.latest()

  if (process.env.NODE_ENV !== 'test') {
    app.use(logger('speckle', 'dev', {}))
  }

  if (process.env.COMPRESSION) {
    app.use(compression())
  }

  app.use(bodyParser.json({ limit: '100mb' }))
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: false }))

  const { init } = require('./modules')

  // Initialise default modules, including rest api handlers
  await init(app)

  // Initialise graphql server
  graphqlServer = module.exports.buildApolloServer()
  graphqlServer.applyMiddleware({ app })

  // Expose prometheus metrics
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', prometheusClient.register.contentType)
      res.end(await prometheusClient.register.metrics())
    } catch (ex) {
      res.status(500).end(ex.message)
    }
  })

  // Trust X-Forwarded-* headers (for https protocol detection)
  app.enable('trust proxy')

  // Log errors
  app.use(errorLoggingMiddleware)

  return { app, graphqlServer }
}

/**
 * Starts a http server, hoisting the express app to it.
 * @param  {[type]} app [description]
 * @return {[type]}     [description]
 */
exports.startHttp = async (app, customPortOverride) => {
  let bindAddress = process.env.BIND_ADDRESS || '127.0.0.1'
  let port = process.env.PORT || 3000

  const frontendHost = process.env.FRONTEND_HOST || 'localhost'
  const frontendPort = process.env.FRONTEND_PORT || 8080

  // Handles frontend proxying:
  // Dev mode -> proxy form the local webpack server
  if (process.env.NODE_ENV === 'development') {
    const { createProxyMiddleware } = require('http-proxy-middleware')
    const frontendProxy = createProxyMiddleware({
      target: `http://${frontendHost}:${frontendPort}`,
      changeOrigin: true,
      ws: false,
      logLevel: 'silent'
    })
    app.use('/', frontendProxy)

    debug('speckle:startup')('✨ Proxying frontend (dev mode):')
    debug('speckle:startup')(`👉 main application: http://localhost:${port}/`)
  }

  // Production mode
  else {
    bindAddress = process.env.BIND_ADDRESS || '0.0.0.0'
  }

  const server = http.createServer(app)
  monitorActiveConnections(server)

  if (customPortOverride || customPortOverride === 0) port = customPortOverride
  app.set('port', port)

  // Final apollo server setup
  graphqlServer.installSubscriptionHandlers(server)
  graphqlServer.applyMiddleware({ app })

  app.use(Sentry.Handlers.errorHandler())

  // large timeout to allow large downloads on slow connections to finish
  createTerminus(server, {
    signals: ['SIGTERM', 'SIGINT'],
    timeout: 5 * 60 * 1000,
    beforeShutdown: () => {
      debug('speckle:shutdown')('Shutting down (signal received)...')
    },
    onSignal: () => {
      // Other custom cleanup after connections are finished
    },
    onShutdown: () => {
      debug('speckle:shutdown')('Shutdown completed')
      process.exit(0)
    }
  })

  server.on('listening', () => {
    debug('speckle:startup')(
      `🚀 My name is Speckle Server, and I'm running at ${server.address().address}:${
        server.address().port
      }`
    )
    app.emit('appStarted')
  })

  server.listen(port, bindAddress)

  server.keepAliveTimeout = 61 * 1000
  server.headersTimeout = 65 * 1000

  return { server }
}
