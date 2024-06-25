/**
 * Module dependencies.
 */

import http from 'http'
import { app } from './app'
import { app as metricsApp } from '../observability/metricsApp'
import { serverLogger } from '../observability/logging'
import { getAppPort, getHost, getMetricsPort } from '../utils/env'

export const startServer = () => {
  /**
   * Get port from environment and store in Express.
   */

  const port = normalizePort(getAppPort())
  app.set('port', port)

  // we place the metrics on a separate port as we wish to expose it to external monitoring tools, but do not wish to expose other routes (for now)
  const metricsPort = normalizePort(getMetricsPort())
  metricsApp.set('port', metricsPort)

  /**
   * Create HTTP server.
   */

  const server = http.createServer(app)
  const metricsServer = http.createServer(metricsApp)

  /**
   * Listen on provided port, on all network interfaces.
   */

  const host = getHost()
  server.listen(port, host)
  server.on('error', onErrorFactory(port))
  server.on('listening', () => {
    serverLogger.info('📡 Started Preview Service server')
    onListening(server)
  })
  metricsServer.listen(metricsPort, host)
  metricsServer.on('error', onErrorFactory(port))
  metricsServer.on('listening', () => {
    serverLogger.info('📊 Started Preview Service metrics server')
    onListening(metricsServer)
  })

  return { app, server, metricsServer }
}

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val: string | number) {
  const port = typeof val === 'string' ? parseInt(val, 10) : val

  if (isNaN(port)) {
    throw new Error('Invalid port; port must be parseable as an integer.')
  }

  if (port >= 0) {
    // port number
    return port
  }

  throw new Error('Invalid port; port must be a positive integer.')
}

/**
 * Event listener for HTTP server "error" event.
 */

const onErrorFactory = (port: string | number | false) => (error: Error) => {
  if ('syscall' in error && error.syscall !== 'listen') {
    throw error
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port

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
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr?.port
  serverLogger.info('Listening on ' + bind)
}
