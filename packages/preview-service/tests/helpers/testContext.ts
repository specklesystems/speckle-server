import { Server } from 'http'
import { Knex } from 'knex'

export interface E2ETestContext {
  context: {
    db: Knex.Transaction
    server: Server
    metricsServer: Server
  }
}

export interface DatabaseIntegrationTestContext {
  context: {
    db: Knex.Transaction
  }
}
