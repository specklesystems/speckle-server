/* istanbul ignore file */
import './bootstrap'
import http from 'http'
import express, { Express } from 'express'

// `express-async-errors` patches express to catch errors in async handlers. no variable needed
import 'express-async-errors'
import compression from 'compression'
import logger from 'morgan-debug'
import debug from 'debug'

import { createTerminus } from '@godaddy/terminus'
import * as Sentry from '@sentry/node'
import Logging from '@/logging'

import { errorLoggingMiddleware } from '@/logging/errorLogging'
import prometheusClient from 'prom-client'

import {
  ApolloServer,
  ForbiddenError,
  ApolloServerExpressConfig
} from 'apollo-server-express'

import { buildContext } from '@/modules/shared'
import knex from '@/db/knex'
import { monitorActiveConnections } from '@/logging/httpServerMonitoring'
import { buildErrorFormatter } from '@/modules/core/graph/setup'
import { isDevEnv, isTestEnv } from '@/modules/shared/helpers/envHelper'
import * as ModulesSetup from '@/modules'
import { Optional } from '@/modules/shared/helpers/typeHelper'

import { get, has, isString, toNumber } from 'lodash'

let graphqlServer: ApolloServer

/**
 * Create Apollo Server instance
 * @param optionOverrides Optionally override ctor options
 */
export function buildApolloServer(
  optionOverrides?: Partial<ApolloServerExpressConfig>
): ApolloServer {
  const debug = optionOverrides?.debug || isDevEnv() || isTestEnv()

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

  const resolvedGraph = ModulesSetup.graph()
  return new ApolloServer({
    ...resolvedGraph,
    context: buildContext,
    subscriptions: {
      onConnect: (connectionParams) => {
        metricConnectCounter.inc()
        metricConnectedClients.inc()

        try {
          let header: Optional<string>

          const possiblePaths = [
            'Authorization',
            'authorization',
            'headers.Authorization',
            'headers.authorization'
          ]

          for (const possiblePath of possiblePaths) {
            if (has(connectionParams, possiblePath)) {
              header = get(connectionParams, possiblePath)
              if (header) break
            }
          }

          if (!header) {
            throw new Error("Couldn't resolve auth header for subscription")
          }

          const token = header.split(' ')[1]
          if (!token) {
            throw new Error("Couldn't resolve token from auth header")
          }

          return { token }
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
export async function init() {
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

  app.use(express.json({ limit: '100mb' }))
  app.use(express.urlencoded({ limit: '100mb', extended: false }))

  // Initialize default modules, including rest api handlers
  await ModulesSetup.init(app)

  // Initialize graphql server
  graphqlServer = module.exports.buildApolloServer()
  graphqlServer.applyMiddleware({ app })

  // Expose prometheus metrics
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', prometheusClient.register.contentType)
      res.end(await prometheusClient.register.metrics())
    } catch (ex: unknown) {
      res.status(500).end(ex instanceof Error ? ex.message : `${ex}`)
    }
  })

  // Trust X-Forwarded-* headers (for https protocol detection)
  app.enable('trust proxy')

  // Log errors
  app.use(errorLoggingMiddleware)

  return { app, graphqlServer }
}

export async function shutdown(): Promise<void> {
  await ModulesSetup.shutdown()
}

/**
 * Starts a http server, hoisting the express app to it.
 */
export async function startHttp(app: Express, customPortOverride?: number) {
  let bindAddress = process.env.BIND_ADDRESS || '127.0.0.1'
  let port = process.env.PORT ? toNumber(process.env.PORT) : 3000

  const frontendHost = process.env.FRONTEND_HOST || 'localhost'
  const frontendPort = process.env.FRONTEND_PORT || 8080

  // Handles frontend proxying:
  // Dev mode -> proxy form the local webpack server
  if (process.env.NODE_ENV === 'development') {
    const { createProxyMiddleware } = await import('http-proxy-middleware')

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
    beforeShutdown: async () => {
      debug('speckle:shutdown')('Shutting down (signal received)...')
    },
    onSignal: async () => {
      await shutdown()
    },
    onShutdown: () => {
      debug('speckle:shutdown')('Shutdown completed')
      process.exit(0)
    }
  })

  server.on('listening', () => {
    const address = server.address()
    const addressString = isString(address) ? address : address?.address
    const port = isString(address) ? null : address?.port

    debug('speckle:startup')(
      `🚀 My name is Speckle Server, and I'm running at ${addressString}:${port}`
    )
    app.emit('appStarted')
  })

  server.listen(port, bindAddress)

  server.keepAliveTimeout = 61 * 1000
  server.headersTimeout = 65 * 1000

  return { server }
}
