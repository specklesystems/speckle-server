import { startServer } from '@/server/server.js'
import type { Knex } from 'knex'
import http from 'http'
import { AddressInfo } from 'net'

export const buildAndStartServers = async (deps: { db: Knex }) => {
  let serverAddress: string | AddressInfo | null = null
  let metricsServerAddress: string | AddressInfo | null = null

  const { db } = deps
  const { app, server, metricsServer } = startServer({ db, serveOnRandomPort: true })
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
