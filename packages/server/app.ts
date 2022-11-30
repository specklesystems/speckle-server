/* istanbul ignore file */
import './bootstrap'
import http from 'http'
import express, { Express } from 'express'

// `express-async-errors` patches express to catch errors in async handlers. no variable needed
import 'express-async-errors'
import compression from 'compression'
import logger from 'morgan-debug'

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
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core'

import { SubscriptionServer } from 'subscriptions-transport-ws'
import { execute, subscribe } from 'graphql'

import { buildContext } from '@/modules/shared'
import knex from '@/db/knex'
import { monitorActiveConnections } from '@/logging/httpServerMonitoring'
import { buildErrorFormatter } from '@/modules/core/graph/setup'
import { isDevEnv, isTestEnv, useNewFrontend } from '@/modules/shared/helpers/envHelper'
import * as ModulesSetup from '@/modules'
import { Optional } from '@/modules/shared/helpers/typeHelper'

import { get, has, isString, toNumber } from 'lodash'
import { corsMiddleware } from '@/modules/core/configs/cors'
import { Roles } from '@speckle/shared'

import { IMocks } from '@graphql-tools/mock'
import { faker } from '@faker-js/faker'
import { startupDebug, shutdownDebug } from '@/modules/shared/utils/logger'

let graphqlServer: ApolloServer

/**
 * TODO: subscriptions-transport-ws is no longer maintained, we should migrate to graphql-ws insted. The problem
 * is that graphql-ws uses an entirely different protocol, so the client-side has to change as well, and so old clients
 * will be unable to use any WebSocket/subscriptions functionality with the updated server
 */
function buildApolloSubscriptionServer(
  apolloServer: ApolloServer,
  server: http.Server
): SubscriptionServer {
  const schema = ModulesSetup.graphSchema()

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

  return SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
      validationRules: apolloServer.requestOptions.validationRules,
      onConnect: async (connectionParams: Record<string, unknown>) => {
        metricConnectCounter.inc()
        metricConnectedClients.inc()

        // Resolve token
        let token: string
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
              header = get(connectionParams, possiblePath) as string
              if (header) break
            }
          }

          if (!header) {
            throw new Error("Couldn't resolve auth header for subscription")
          }

          token = header.split(' ')[1]
          if (!token) {
            throw new Error("Couldn't resolve token from auth header")
          }
        } catch (e) {
          throw new ForbiddenError('You need a token to subscribe')
        }

        // Build context (Apollo Server v3 no longer triggers context building automatically
        // for subscriptions)
        try {
          return await buildContext({
            connection: { context: { token } },
            req: undefined
          })
        } catch (e) {
          throw new ForbiddenError('Subscription context build failed')
        }
      },
      onDisconnect: () => {
        metricConnectedClients.dec()
      }
    },
    {
      server,
      path: apolloServer.graphqlPath
    }
  )
}

/**
 * Define mocking config in dev env
 * https://www.apollographql.com/docs/apollo-server/v3/testing/mocking
 */
function buildMocksConfig(): { mocks: boolean | IMocks; mockEntireSchema: boolean } {
  const roles = Object.values(Roles.Stream)
  const isDebugEnv = isDevEnv()
  if (!isDebugEnv) return { mocks: false, mockEntireSchema: false } // we def don't want this on in prod

  return {
    mocks: {
      Query: () => ({
        testNumber: () => faker.datatype.number(),
        testList: () => [...new Array(faker.datatype.number({ min: 1, max: 10 }))],
        projects: () => [...new Array(faker.datatype.number({ min: 5, max: 12 }))]
      }),
      DateTime: () => faker.datatype.datetime(),
      ID: () => faker.unique(faker.random.alphaNumeric, [10]),
      Project: () => ({
        team: [...new Array(faker.datatype.number({ min: 1, max: 5 }))],
        name:
          faker.commerce.productAdjective() +
          ' ' +
          faker.commerce.productMaterial() +
          ' ' +
          faker.commerce.product() +
          ' ' +
          faker.commerce.product(),
        modelCount: faker.datatype.number({ min: 0, max: 100 }),
        role: roles[
          faker.datatype.number({
            min: 0,
            max: roles.length - 1
          })
        ]
      }),
      JSONObject: () => ({})
    },
    mockEntireSchema: false
  }
}

/**
 * Create Apollo Server instance
 * @param optionOverrides Optionally override ctor options
 * @param subscriptionServerResolver If you expect to use subscriptions on this instance,
 * pass in a callable that resolves the subscription server
 */
export async function buildApolloServer(
  optionOverrides?: Partial<ApolloServerExpressConfig>,
  subscriptionServerResolver?: () => SubscriptionServer
): Promise<ApolloServer> {
  const debug = optionOverrides?.debug || isDevEnv() || isTestEnv()
  const schema = ModulesSetup.graphSchema()
  const { mockEntireSchema, mocks } = buildMocksConfig()

  const server = new ApolloServer({
    schema,
    context: buildContext,
    plugins: [
      require('@/logging/apolloPlugin'),
      ApolloServerPluginLandingPageLocalDefault({
        embed: true,
        includeCookies: true
      }),
      ...(subscriptionServerResolver
        ? [
            {
              async serverWillStart() {
                return {
                  async drainServer() {
                    subscriptionServerResolver().close()
                  }
                }
              }
            }
          ]
        : [])
    ],
    introspection: true,
    cache: 'bounded',
    persistedQueries: false,
    csrfPrevention: true,
    formatError: buildErrorFormatter(debug),
    debug,
    mocks,
    mockEntireSchema,
    ...optionOverrides
  })
  await server.start()

  return server
}

/**
 * Initialises all server (express/subscription/http) instances
 */
export async function init() {
  if (useNewFrontend()) {
    startupDebug('🖼️  Serving for frontend-2...')
  }

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

  app.use(corsMiddleware())
  app.use(express.json({ limit: '100mb' }))
  app.use(express.urlencoded({ limit: '100mb', extended: false }))

  // Initialize default modules, including rest api handlers
  await ModulesSetup.init(app)

  // Initialize graphql server
  // (Apollo Server v3 has an ugly API here - the ApolloServer ctor needs SubscriptionServer,
  // and the SubscriptionServer ctor needs ApolloServer...hence the callback passed into buildApolloServer)
  // eslint-disable-next-line prefer-const
  let subscriptionServer: SubscriptionServer
  graphqlServer = await buildApolloServer(undefined, () => subscriptionServer)
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

  // Init HTTP server & subscription server
  const server = http.createServer(app)
  subscriptionServer = buildApolloSubscriptionServer(graphqlServer, server)

  return { app, graphqlServer, server, subscriptionServer }
}

export async function shutdown(): Promise<void> {
  await ModulesSetup.shutdown()
}

/**
 * Starts a http server, hoisting the express app to it.
 */
export async function startHttp(
  server: http.Server,
  app: Express,
  customPortOverride?: number
) {
  let bindAddress = process.env.BIND_ADDRESS || '127.0.0.1'
  let port = process.env.PORT ? toNumber(process.env.PORT) : 3000

  const frontendHost = process.env.FRONTEND_HOST || 'localhost'
  const frontendPort = process.env.FRONTEND_PORT || 8080

  // Handles frontend proxying:
  // Dev mode -> proxy form the local webpack server
  if (process.env.NODE_ENV === 'development') {
    const { createProxyMiddleware } = await import('http-proxy-middleware')

    // even tho it has default values, it fixes http-proxy setting `Connection: close` on each request
    // slowing everything down
    const defaultAgent = new http.Agent()

    const frontendProxy = createProxyMiddleware({
      target: `http://${frontendHost}:${frontendPort}`,
      changeOrigin: true,
      ws: false,
      agent: defaultAgent,
      pathFilter: (path: string) => !path.match(/^\/(auth|graphql)\//)
    })
    app.use('/', frontendProxy)

    startupDebug('✨ Proxying frontend-1 (dev mode):')
    startupDebug(`👉 main application: http://localhost:${port}/`)
  }

  // Production mode
  else {
    bindAddress = process.env.BIND_ADDRESS || '0.0.0.0'
  }

  monitorActiveConnections(server)

  if (customPortOverride || customPortOverride === 0) port = customPortOverride
  app.set('port', port)

  app.use(Sentry.Handlers.errorHandler())

  // large timeout to allow large downloads on slow connections to finish
  createTerminus(server, {
    signals: ['SIGTERM', 'SIGINT'],
    timeout: 5 * 60 * 1000,
    beforeShutdown: async () => {
      shutdownDebug('Shutting down (signal received)...')
    },
    onSignal: async () => {
      await shutdown()
    },
    onShutdown: () => {
      shutdownDebug('Shutdown completed')
      process.exit(0)
    }
  })

  server.on('listening', () => {
    const address = server.address()
    const addressString = isString(address) ? address : address?.address
    const port = isString(address) ? null : address?.port

    startupDebug(
      `🚀 My name is Speckle Server, and I'm running at ${addressString}:${port}`
    )
    app.emit('appStarted')
  })

  server.listen(port, bindAddress)

  server.keepAliveTimeout = 61 * 1000
  server.headersTimeout = 65 * 1000

  return { server }
}
