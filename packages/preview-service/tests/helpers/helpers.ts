import { startServer } from '@/server/server.js'
import http from 'http'
import type { AddressInfo } from 'net'
import { getPostgresConnectionString } from '@/utils/env.js'

export const startAndWaitOnServers = async () => {
  let serverAddress: string | AddressInfo | null = null
  let metricsServerAddress: string | AddressInfo | null = null

  const { app, server, metricsServer } = await startServer({
    serveOnRandomPort: true
  })
  server.on('listening', () => {
    serverAddress = server.address()
  })
  metricsServer.on('listening', () => {
    metricsServerAddress = metricsServer.address()
  })

  //HACK wait until both servers are available
  while (!serverAddress || !metricsServerAddress) {
    // wait for the servers to start
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return { app, server, metricsServer }
}

export const getServerPort = (server: http.Server) => {
  const address = server.address()
  if (address && typeof address !== 'string') {
    return address.port
  }
  throw new Error('Server port is not available')
}

export const customizePostgresConnectionString = (databaseName?: string) => {
  const originalPostgresConnectionString = getPostgresConnectionString()
  if (!databaseName) return originalPostgresConnectionString

  const originalPostgresUrl = new URL(originalPostgresConnectionString)
  const protocol = originalPostgresUrl.protocol
  const user = originalPostgresUrl.username
  const pass = originalPostgresUrl.password
  const host = originalPostgresUrl.hostname
  const port = originalPostgresUrl.port
  const origin = `${protocol}//${user}:${pass}@${host}:${port}`
  return new URL(databaseName, origin).toString()
}
