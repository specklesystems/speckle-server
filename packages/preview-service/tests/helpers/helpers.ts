import { startServer } from '@/server/server.js'
import type { Knex } from 'knex'

export const buildAndStartServers = (deps: { db: Knex }) => {
  const { db } = deps
  const { app, server, metricsServer } = startServer({ db, serveOnRandomPort: true })
  return { app, server, metricsServer }
}
