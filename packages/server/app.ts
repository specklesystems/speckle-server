/* eslint-disable camelcase */
/* istanbul ignore file */
import './bootstrap'
import http from 'http'
import express, { Express } from 'express'

// `express-async-errors` patches express to catch errors in async handlers. no variable needed
import 'express-async-errors'
import compression from 'compression'
import cookieParser from 'cookie-parser'

import { createTerminus } from '@godaddy/terminus'
import * as Sentry from '@sentry/node'
import Logging from '@/logging'
import { startupLogger, shutdownLogger } from '@/logging/logging'
import {
  DetermineRequestIdMiddleware,
  LoggingExpressMiddleware
} from '@/logging/expressLogging'

import { errorLoggingMiddleware } from '@/logging/errorLogging'
import prometheusClient from 'prom-client'

import {
  ApolloServer,
  ForbiddenError,
  ApolloServerExpressConfig,
  ApolloError
} from 'apollo-server-express'
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginUsageReportingDisabled,
  ApolloServerPluginUsageReporting
} from 'apollo-server-core'

import { ExecutionParams, SubscriptionServer } from 'subscriptions-transport-ws'
import { execute, subscribe } from 'graphql'

import knex from '@/db/knex'
import { monitorActiveConnections } from '@/logging/httpServerMonitoring'
import { buildErrorFormatter } from '@/modules/core/graph/setup'
import {
  getFileSizeLimitMB,
  isDevEnv,
  isTestEnv,
  useNewFrontend,
  isApolloMonitoringEnabled
} from '@/modules/shared/helpers/envHelper'
import * as ModulesSetup from '@/modules'
import { GraphQLContext, Optional } from '@/modules/shared/helpers/typeHelper'
import { createRateLimiterMiddleware } from '@/modules/core/services/ratelimiter'

import { get, has, isString, toNumber } from 'lodash'
import { corsMiddleware } from '@/modules/core/configs/cors'
import {
  authContextMiddleware,
  buildContext,
  determineClientIpAddressMiddleware,
  mixpanelTrackerHelperMiddleware
} from '@/modules/shared/middleware'
import { GraphQLError } from 'graphql'
import { redactSensitiveVariables } from '@/logging/loggingHelper'
import { buildMocksConfig } from '@/modules/mocks'
import { defaultErrorHandler } from '@/modules/core/rest/defaultErrorHandler'
import { migrateDbToLatest } from '@/db/migrations'
import { statusCodePlugin } from '@/modules/core/graph/plugins/statusCode'

let graphqlServer: ApolloServer

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SubscriptionResponse = { errors?: GraphQLError[]; data?: any }

function logSubscriptionOperation(params: {
  ctx: GraphQLContext
  execParams: ExecutionParams
  error?: Error
  response?: SubscriptionResponse
}) {
  const { error, response, ctx, execParams } = params
  const userId = ctx.userId
  if (!error && !response) return

  const logger = ctx.log.child({
    graphql_query: execParams.query.toString(),
    graphql_variables: redactSensitiveVariables(execParams.variables),
    graphql_operation_name: execParams.operationName,
    graphql_operation_type: 'subscription',
    userId
  })

  const errMsg = 'GQL subscription event {graphql_operation_name} errored'
  const errors = response?.errors || (error ? [error] : [])
  if (errors.length) {
    for (const error of errors) {
      if (
        (error instanceof GraphQLError && error.extensions?.code === 'FORBIDDEN') ||
        error instanceof ApolloError
      ) {
        logger.info(error, errMsg)
      } else {
        logger.error(error, errMsg)
      }
    }
  } else if (response?.data) {
    logger.info('GQL subscription event {graphql_operation_name} emitted')
  }
}

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

  prometheusClient.register.removeSingleMetric(
    'speckle_server_apollo_graphql_total_subscription_operations'
  )
  const metricSubscriptionTotalOperations = new prometheusClient.Counter({
    name: 'speckle_server_apollo_graphql_total_subscription_operations',
    help: 'Number of total subscription operations served by this instance',
    labelNames: ['subscriptionType'] as const
  })

  prometheusClient.register.removeSingleMetric(
    'speckle_server_apollo_graphql_total_subscription_responses'
  )
  const metricSubscriptionTotalResponses = new prometheusClient.Counter({
    name: 'speckle_server_apollo_graphql_total_subscription_responses',
    help: 'Number of total subscription responses served by this instance',
    labelNames: ['subscriptionType', 'status'] as const
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
          return await buildContext({ req: null, token, cleanLoadersEarly: false })
        } catch (e) {
          throw new ForbiddenError('Subscription context build failed')
        }
      },
      onDisconnect: () => {
        metricConnectedClients.dec()
      },
      onOperation: (...params: [() => void, ExecutionParams]) => {
        // kinda hacky, but we're using this as an "subscription event emitted"
        // callback to clear subscription connection dataloaders to avoid stale cache
        const baseParams = params[1]
        metricSubscriptionTotalOperations.inc({
          subscriptionType: baseParams.operationName
        })
        const ctx = baseParams.context as GraphQLContext

        baseParams.formatResponse = (val: SubscriptionResponse) => {
          ctx.loaders.clearAll()
          logSubscriptionOperation({ ctx, execParams: baseParams, response: val })
          metricSubscriptionTotalResponses.inc({
            subscriptionType: baseParams.operationName,
            status: 'success'
          })
          return val
        }
        baseParams.formatError = (e: Error) => {
          ctx.loaders.clearAll()
          logSubscriptionOperation({ ctx, execParams: baseParams, error: e })

          metricSubscriptionTotalResponses.inc({
            subscriptionType: baseParams.operationName,
            status: 'error'
          })
          return e
        }

        return baseParams
      }
    },
    {
      server,
      path: apolloServer.graphqlPath
    }
  )
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
  const schema = ModulesSetup.graphSchema(await buildMocksConfig())

  const server = new ApolloServer({
    schema,
    context: buildContext,
    plugins: [
      statusCodePlugin,
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
    formatError: buildErrorFormatter(debug),
    debug,
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
    startupLogger.info('🖼️  Serving for frontend-2...')
  }

  const app = express()
  app.disable('x-powered-by')

  Logging(app)

  // Moves things along automatically on restart.
  // Should perhaps be done manually?
  await migrateDbToLatest(knex)()

  app.use(cookieParser())
  app.use(DetermineRequestIdMiddleware)
  app.use(determineClientIpAddressMiddleware)
  app.use(LoggingExpressMiddleware)

  if (process.env.COMPRESSION) {
    app.use(compression())
  }

  app.use(corsMiddleware())
  app.use(express.json({ limit: '100mb' }))
  app.use(express.urlencoded({ limit: `${getFileSizeLimitMB()}mb`, extended: false }))

  // Trust X-Forwarded-* headers (for https protocol detection)
  app.enable('trust proxy')

  // Log errors
  app.use(errorLoggingMiddleware)
  app.use(authContextMiddleware)
  app.use(createRateLimiterMiddleware())
  app.use(mixpanelTrackerHelperMiddleware)

  app.use(Sentry.Handlers.errorHandler())

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

  // Init HTTP server & subscription server
  const server = http.createServer(app)
  subscriptionServer = buildApolloSubscriptionServer(graphqlServer, server)

  // At the very end adding default error handler middleware
  app.use(defaultErrorHandler)

  return { app, graphqlServer, server, subscriptionServer }
}

export async function shutdown(): Promise<void> {
  await ModulesSetup.shutdown()
}

const shouldUseFrontendProxy = () => process.env.NODE_ENV === 'development'

async function createFrontendProxy() {
  const frontendHost = process.env.FRONTEND_HOST || '127.0.0.1'
  const frontendPort = process.env.FRONTEND_PORT || 8080
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
export async function startHttp(
  server: http.Server,
  app: Express,
  customPortOverride?: number
) {
  let bindAddress = process.env.BIND_ADDRESS || '127.0.0.1'
  let port = process.env.PORT ? toNumber(process.env.PORT) : 3000

  if (customPortOverride || customPortOverride === 0) port = customPortOverride
  if (shouldUseFrontendProxy()) {
    // app.use('/', frontendProxy)
    app.use(await createFrontendProxy())

    startupLogger.info('✨ Proxying frontend-1 (dev mode):')
    startupLogger.info(`👉 main application: http://127.0.0.1:${port}/`)
  }

  // Production mode
  else {
    bindAddress = process.env.BIND_ADDRESS || '0.0.0.0'
  }

  monitorActiveConnections(server)

  app.set('port', port)

  // large timeout to allow large downloads on slow connections to finish
  createTerminus(server, {
    signals: ['SIGTERM', 'SIGINT'],
    timeout: 5 * 60 * 1000,
    beforeShutdown: async () => {
      shutdownLogger.info('Shutting down (signal received)...')
    },
    onSignal: async () => {
      await shutdown()
    },
    onShutdown: () => {
      shutdownLogger.info('Shutdown completed')
      process.exit(0)
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
