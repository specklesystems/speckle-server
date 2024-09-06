import { serverLogger } from '@/observability/logging.js'
import { appFactory as metricsAppFactory } from '@/observability/metricsApp.js'
import { appFactory } from '@/server/app.js'
import { getAppPort, getHost, getMetricsHost, getMetricsPort } from '@/utils/env.js'
import http from 'http'
import type { Knex } from 'knex'
import { isNaN, isString, toNumber } from 'lodash-es'
import { PuppeteerClient, puppeteerClientFactory } from '@/clients/puppeteer.js'
import { extendLoggerComponent, logger } from '@/observability/logging.js'
import { puppeteerDriver } from '@/scripts/puppeteerDriver.js'
import {
  getChromiumExecutablePath,
  getPreviewTimeout,
  getPuppeteerUserDataDir,
  serviceOrigin,
  shouldBeHeadless
} from '@/utils/env.js'

export const startServer = async (params: {
  db: Knex
  serveOnRandomPort?: boolean
}) => {
  const { db } = params

  const puppeteerClient = await puppeteerClientFactory({
    logger: extendLoggerComponent(logger, 'puppeteerClient'),
    url: `${serviceOrigin()}/render/`,
    script: puppeteerDriver,
    launchParams: {
      headless: shouldBeHeadless(),
      userDataDir: getPuppeteerUserDataDir(),
      executablePath: getChromiumExecutablePath(),
      protocolTimeout: getPreviewTimeout(),
      // we trust the web content that is running, so can disable the sandbox
      // disabling the sandbox allows us to run the docker image without linux kernel privileges
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    },
    timeoutMilliseconds: getPreviewTimeout()
  })
  /**
   * Get port from environment and store in Express.
   */
  const inputPort = params.serveOnRandomPort ? 0 : normalizePort(getAppPort())
  const app = appFactory({ db, puppeteerClient })
  app.set('port', inputPort)

  // we place the metrics on a separate port as we wish to expose it to external monitoring tools, but do not wish to expose other routes (for now)
  const inputMetricsPort = params.serveOnRandomPort
    ? 0
    : normalizePort(getMetricsPort())
  const metricsApp = metricsAppFactory({ db })
  metricsApp.set('port', inputMetricsPort)

  /**
   * Create HTTP server.
   */

  const server = http.createServer(app)
  const metricsServer = http.createServer(metricsApp)

  /**
   * Listen on provided port, on all network interfaces.
   */
  const host = getHost()
  server.on('error', onErrorFactory(inputPort))
  server.on('listening', () => {
    serverLogger.info('📡 Started Preview Service server')
    onListening(server)
  })
  server.listen(inputPort, host)

  const metricsHost = getMetricsHost()
  metricsServer.on('error', onErrorFactory(inputPort))
  metricsServer.on('listening', () => {
    serverLogger.info('📊 Started Preview Service metrics server')
    onListening(metricsServer)
  })
  metricsServer.listen(inputMetricsPort, metricsHost)

  return { app, server, metricsServer, puppeteerClient }
}

export const stopServer = async (params: {
  server: http.Server
  puppeteerClient: PuppeteerClient
}) => {
  const { server, puppeteerClient } = params
  await puppeteerClient.dispose()
  server.close()
}

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val: string | number) {
  const port = toNumber(val)
  if (!isNaN(port) && port >= 0) return port

  throw new Error('Invalid port; port must be a positive integer.')
}

/**
 * Event listener for HTTP server "error" event.
 */

const onErrorFactory = (port: string | number | false) => (error: Error) => {
  if ('syscall' in error && error.syscall !== 'listen') {
    throw error
  }

  const bind = isString(port) ? 'Pipe ' + port : 'Port ' + port

  if (!('code' in error)) throw error

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      serverLogger.error(error, bind + ' requires elevated privileges')
      process.exit(1)
    case 'EADDRINUSE':
      serverLogger.error(error, bind + ' is already in use')
      process.exit(1)
    default:
      throw error
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening(referenceServer: http.Server) {
  const addr = referenceServer.address()
  if (!addr) throw new Error('Server address is not defined')

  switch (typeof addr) {
    case 'string':
      serverLogger.info(`Listening on pipe ${addr}`)
      return addr
    default:
      serverLogger.info(`Listening on port ${addr.port}`)
      return addr.port
  }
}
