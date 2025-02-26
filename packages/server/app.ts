/* eslint-disable camelcase */
/* eslint-disable  no-restricted-imports */
/* istanbul ignore file */
import './bootstrap'
import http from 'http'
import express, { Express } from 'express'

// `express-async-errors` patches express to catch errors in async handlers. no variable needed
import 'express-async-errors'
import cookieParser from 'cookie-parser'

import { createTerminus } from '@godaddy/terminus'
import Metrics from '@/logging'
import {
  startupLogger,
  shutdownLogger,
  subscriptionLogger,
  graphqlLogger
} from '@/logging/logging'
import {
  DetermineRequestIdMiddleware,
  LoggingExpressMiddleware,
  sanitizeHeaders
} from '@/logging/expressLogging'

import { errorMetricsMiddleware } from '@/logging/errorMetrics'
import prometheusClient from 'prom-client'

import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import { ApolloServerPluginUsageReporting } from '@apollo/server/plugin/usageReporting'
import { ApolloServerPluginUsageReportingDisabled } from '@apollo/server/plugin/disabled'
import type { ConnectionContext } from 'subscriptions-transport-ws'
import { SubscriptionServer } from 'subscriptions-transport-ws'
import { execute, subscribe } from 'graphql'

import knex, { db } from '@/db/knex'
import { monitorActiveConnections } from '@/logging/httpServerMonitoring'
import { buildErrorFormatter } from '@/modules/core/graph/setup'
import {
  getFileSizeLimitMB,
  isDevEnv,
  isTestEnv,
  isApolloMonitoringEnabled,
  enableMixpanel,
  getPort,
  getBindAddress,
  shutdownTimeoutSeconds,
  asyncRequestContextEnabled,
  getMaximumRequestBodySizeMB,
  isCompressionEnabled,
  isRateLimiterEnabled
} from '@/modules/shared/helpers/envHelper'
import * as ModulesSetup from '@/modules'
import { GraphQLContext, Optional } from '@/modules/shared/helpers/typeHelper'

import { get, has, isString } from 'lodash'
import { corsMiddlewareFactory } from '@/modules/core/configs/cors'
import {
  authContextMiddleware,
  buildContext,
  compressionMiddlewareFactory,
  determineClientIpAddressMiddleware,
  mixpanelTrackerHelperMiddlewareFactory,
  requestBodyParsingMiddlewareFactory,
  setContentSecurityPolicyHeaderMiddleware
} from '@/modules/shared/middleware'
import { buildMocksConfig } from '@/modules/mocks'
import { defaultErrorHandler } from '@/modules/core/rest/defaultErrorHandler'
import { migrateDbToLatest } from '@/db/migrations'
import { statusCodePlugin } from '@/modules/core/graph/plugins/statusCode'
import { BadRequestError, ForbiddenError } from '@/modules/shared/errors'
import { loggingPluginFactory } from '@/modules/core/graph/plugins/logging'
import { getUserFactory } from '@/modules/core/repositories/users'
import { initFactory as healthchecksInitFactory } from '@/healthchecks'
import type { ReadinessHandler } from '@/healthchecks/types'
import type ws from 'ws'
import type { Server as MockWsServer } from 'mock-socket'
import { SetOptional } from 'type-fest'
import {
  enterNewRequestContext,
  getRequestContext,
  initiateRequestContextMiddleware
} from '@/logging/requestContext'
import { randomUUID } from 'crypto'
import { onOperationHandlerFactory } from '@/logging/apolloSubscriptions'
import { initApolloSubscriptionMonitoring } from './logging/apolloSubscriptionMonitoring'
import { createRateLimiterMiddleware } from '@/modules/core/rest/ratelimiter'

const GRAPHQL_PATH = '/graphql'

/**
 * In mocked Ws connections, request will be undefined
 */
type PossiblyMockedConnectionContext = SetOptional<ConnectionContext, 'request'>

const isWsServer = (server: http.Server | MockWsServer): server is MockWsServer => {
  return 'on' in server && 'clients' in server
}

/**
 * TODO: subscriptions-transport-ws is no longer maintained, we should migrate to graphql-ws insted. The problem
 * is that graphql-ws uses an entirely different protocol, so the client-side has to change as well, and so old clients
 * will be unable to use any WebSocket/subscriptions functionality with the updated server
 */
export function buildApolloSubscriptionServer(
  server: http.Server | MockWsServer
): SubscriptionServer {
  const httpServer = isWsServer(server) ? undefined : server
  const mockServer = isWsServer(server) ? server : undefined

  // we have to break the type here, cause its a mock
  const wsServer = mockServer ? (mockServer as unknown as ws.Server) : undefined
  const schema = ModulesSetup.graphSchema()

  const {
    metricConnectCounter,
    metricConnectedClients,
    metricSubscriptionTotalOperations,
    metricSubscriptionTotalResponses
  } = initApolloSubscriptionMonitoring()

  const getHeaders = (params: {
    connContext?: PossiblyMockedConnectionContext
    connectionParams?: Record<string, unknown>
  }) => {
    const { connContext, connectionParams } = params
    const connCtxHeaders = connContext?.request?.headers || {}
    const paramsHeaders = connectionParams?.headers || {}

    return {
      ...connCtxHeaders,
      ...paramsHeaders
    } as Record<string, string>
  }

  return SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
      onConnect: async (
        connectionParams: Record<string, unknown>,
        webSocket: WebSocket,
        connContext: PossiblyMockedConnectionContext
      ) => {
        metricConnectCounter.inc()
        metricConnectedClients.inc()

        const logger = connContext.request?.log || subscriptionLogger

        const possiblePaths = [
          'Authorization',
          'authorization',
          'headers.Authorization',
          'headers.authorization'
        ]

        // Resolve token
        let token: string
        try {
          const headers = getHeaders({ connContext, connectionParams })
          const requestId = headers['x-request-id'] || `ws-${randomUUID()}`
          enterNewRequestContext({ reqId: requestId })

          logger.debug(
            { requestId, headers: sanitizeHeaders(headers) },
            'New websocket connection'
          )
          let header: Optional<string>

          for (const possiblePath of possiblePaths) {
            if (has(connectionParams, possiblePath)) {
              header = get(connectionParams, possiblePath) as string
              if (header) break
            }
          }

          if (!header) {
            throw new BadRequestError("Couldn't resolve auth header for subscription")
          }

          token = header.split(' ')[1]
          if (!token) {
            throw new BadRequestError("Couldn't resolve token from auth header")
          }
        } catch {
          throw new ForbiddenError('You need a token to subscribe')
        }

        // Build context (Apollo Server v3 no longer triggers context building automatically
        // for subscriptions)
        try {
          const headers = getHeaders({ connContext, connectionParams })
          const buildCtx = await buildContext({
            req: null,
            token,
            cleanLoadersEarly: false
          })
          buildCtx.log.info(
            {
              userId: buildCtx.userId,
              ws_protocol: webSocket.protocol,
              ws_url: webSocket.url,
              headers: sanitizeHeaders(headers)
            },
            'Websocket connected and subscription context built.'
          )
          return buildCtx
        } catch {
          throw new ForbiddenError('Subscription context build failed')
        }
      },
      onDisconnect: (
        webSocket: WebSocket,
        connContext: PossiblyMockedConnectionContext
      ) => {
        const reqCtx = getRequestContext()
        const logger = connContext.request?.log || subscriptionLogger
        const headers = getHeaders({ connContext })
        logger.debug(
          {
            ws_protocol: webSocket.protocol,
            ws_url: webSocket.url,
            headers: sanitizeHeaders(headers),
            ...(reqCtx ? { req: { id: reqCtx.requestId } } : {})
          },
          'Websocket disconnected.'
        )
        metricConnectedClients.dec()
      },
      onOperation: onOperationHandlerFactory({
        metricSubscriptionTotalOperations,
        metricSubscriptionTotalResponses
      }),
      keepAlive: 30000 //milliseconds. Loadbalancers may close the connection after inactivity. e.g. nginx default is 60000ms.
    },
    wsServer || {
      server: httpServer!,
      path: GRAPHQL_PATH
    }
  )
}

/**
 * Create Apollo Server instance
 */
export async function buildApolloServer(options?: {
  subscriptionServer?: SubscriptionServer
}): Promise<ApolloServer<GraphQLContext>> {
  const includeStacktraceInErrorResponses = isDevEnv() || isTestEnv()
  const subscriptionServer = options?.subscriptionServer
  const schema = ModulesSetup.graphSchema(await buildMocksConfig())

  const server = new ApolloServer({
    schema,
    plugins: [
      statusCodePlugin,
      loggingPluginFactory({ register: prometheusClient.register }),
      ApolloServerPluginLandingPageLocalDefault({
        embed: true,
        includeCookies: true
      }),
      ...(subscriptionServer
        ? [
            {
              async serverWillStart() {
                return {
                  async drainServer() {
                    subscriptionServer?.close()
                  }
                }
              }
            }
          ]
        : []),
      ...(isApolloMonitoringEnabled()
        ? [
            ApolloServerPluginUsageReporting({
              // send all headers (except auth ones)
              sendHeaders: { all: true }
            })
          ]
        : [ApolloServerPluginUsageReportingDisabled()])
    ],
    introspection: true,
    cache: 'bounded',
    persistedQueries: false,
    csrfPrevention: true,
    formatError: buildErrorFormatter({ includeStacktraceInErrorResponses }),
    includeStacktraceInErrorResponses,
    status400ForVariableCoercionErrors: true,
    stopOnTerminationSignals: false, // handled by terminus and shutdown function
    logger: graphqlLogger
  })
  await server.start()

  return server
}

/**
 * Initialises all server (express/subscription/http) instances
 */
export async function init() {
  startupLogger.info('🖼️  Serving for frontend-2...')

  const app = express()
  app.disable('x-powered-by')

  // Moves things along automatically on restart.
  // Should perhaps be done manually?
  await migrateDbToLatest({ region: 'main', db: knex })

  app.use(cookieParser())
  app.use(DetermineRequestIdMiddleware)
  app.use(initiateRequestContextMiddleware)
  app.use(determineClientIpAddressMiddleware)
  app.use(LoggingExpressMiddleware)

  if (asyncRequestContextEnabled()) {
    startupLogger.info('Async request context tracking enabled 👀')
  }

  app.use(
    compressionMiddlewareFactory({ isCompressionEnabled: isCompressionEnabled() })
  )

  app.use(corsMiddlewareFactory())

  app.use(
    requestBodyParsingMiddlewareFactory({
      maximumRequestBodySizeMb: getMaximumRequestBodySizeMB()
    })
  ) // there are some paths that need the raw body, not a parsed body
  app.use(express.urlencoded({ limit: `${getFileSizeLimitMB()}mb`, extended: false }))

  // Trust X-Forwarded-* headers (for https protocol detection)
  app.enable('trust proxy')

  app.use(createRateLimiterMiddleware({ rateLimiterEnabled: isRateLimiterEnabled() })) // Rate limiting by IP address for all users
  app.use(authContextMiddleware)
  app.use(setContentSecurityPolicyHeaderMiddleware)
  if (enableMixpanel())
    app.use(mixpanelTrackerHelperMiddlewareFactory({ getUser: getUserFactory({ db }) }))

  // Initialize default modules, including rest api handlers
  await ModulesSetup.init(app)

  // Initialize healthchecks
  const healthchecks = await healthchecksInitFactory()(app, true)

  // Metrics relies on 'regions' table in the database, so much be initialized after migrations in the main database ("migrateDbToLatest({ region: 'main'," etc..)
  // It also relies on the regional knex clients, which will initialize and run migrations in the respective regions.
  // It must be initialized after the multiregion module is initialized in ModulesSetup.init
  await Metrics(app)

  // Init HTTP server & subscription server
  const server = http.createServer(app)
  const subscriptionServer = buildApolloSubscriptionServer(server)

  // Initialize graphql server
  const graphqlServer = await buildApolloServer({
    subscriptionServer
  })
  app.use(
    GRAPHQL_PATH,
    expressMiddleware(graphqlServer, {
      context: buildContext
    })
  )

  // At the very end adding default error handler middleware
  app.use(errorMetricsMiddleware)
  app.use(defaultErrorHandler)

  return {
    app,
    graphqlServer,
    server,
    subscriptionServer,
    readinessCheck: healthchecks.isReady
  }
}

export async function shutdown(params: {
  graphqlServer: Optional<ApolloServer<GraphQLContext>>
}): Promise<void> {
  await params.graphqlServer?.stop()
  await ModulesSetup.shutdown()
}

const shouldUseFrontendProxy = () => isDevEnv()

async function createFrontendProxy() {
  const frontendHost = process.env.FRONTEND_HOST || '127.0.0.1'
  const frontendPort = process.env.FRONTEND_PORT || 8081
  const { createProxyMiddleware } = await import('http-proxy-middleware')

  // even tho it has default values, it fixes http-proxy setting `Connection: close` on each request
  // slowing everything down
  const defaultAgent = new http.Agent()

  return createProxyMiddleware({
    target: `http://${frontendHost}:${frontendPort}`,
    changeOrigin: true,
    ws: false,
    agent: defaultAgent
  })
}

/**
 * Starts a http server, hoisting the express app to it.
 */
export async function startHttp(params: {
  server: http.Server
  app: Express
  graphqlServer: ApolloServer<GraphQLContext>
  readinessCheck: ReadinessHandler
  customPortOverride?: number
}) {
  const { server, app, graphqlServer, readinessCheck, customPortOverride } = params
  let bindAddress = getBindAddress() // defaults to 127.0.0.1
  let port = getPort() // defaults to 3000

  if (customPortOverride || customPortOverride === 0) port = customPortOverride
  if (shouldUseFrontendProxy()) {
    // app.use('/', frontendProxy)
    app.use(await createFrontendProxy())

    startupLogger.info('✨ Proxying frontend (dev mode):')
    startupLogger.info(`👉 main application: http://127.0.0.1:${port}/`)
  }

  // Production mode
  else {
    bindAddress = getBindAddress('0.0.0.0')
  }

  monitorActiveConnections(server)

  app.set('port', port)

  // large timeout to allow large downloads on slow connections to finish
  createTerminus(server, {
    signals: ['SIGTERM', 'SIGINT'],
    timeout: shutdownTimeoutSeconds() * 1000,
    beforeShutdown: async () => {
      shutdownLogger.info('Shutting down (signal received)...')
    },
    onSignal: async () => {
      await shutdown({ graphqlServer })
    },
    onShutdown: () => {
      shutdownLogger.info('Shutdown completed')
      shutdownLogger.flush()
      return Promise.resolve()
    },
    healthChecks: {
      '/readiness': readinessCheck,
      // '/liveness' should return true even if in shutdown phase, so app does not get restarted while draining connections
      // therefore we cannot use terminus to handle liveness checks.
      verbatim: true
    },
    logger: (message, err) => {
      if (err) {
        shutdownLogger.warn({ err }, message)
      } else {
        shutdownLogger.info(message)
      }
    }
  })

  server.on('listening', () => {
    const address = server.address()
    const addressString = isString(address) ? address : address?.address
    const port = isString(address) ? null : address?.port

    startupLogger.info(
      `🚀 My name is Speckle Server, and I'm running at ${addressString}:${port}`
    )
    app.emit('appStarted')
  })

  server.listen(port, bindAddress)

  server.keepAliveTimeout = 61 * 1000
  server.headersTimeout = 65 * 1000

  return { server }
}
