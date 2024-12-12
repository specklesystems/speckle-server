import { stopServer } from '@/server/server.js'
import { inject, test } from 'vitest'
import { getTestDb } from '#/helpers/testKnexClient.js'
import { startAndWaitOnServers } from '#/helpers/helpers.js'
import type { Knex } from 'knex'
import { Server } from 'http'

export interface DatabaseIntegrationTestContext {
  context: {
    db: Knex.Transaction
  }
}

// vitest reference: https://vitest.dev/guide/test-context#fixture-initialization
export const databaseIntegrationTest = test.extend<DatabaseIntegrationTestContext>({
  // this key has to match the top level key in the interface (i.e. `context`). Some vitest typing magic at work here.
  context: [
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async ({ task, onTestFinished }, use) => {
      const dbName = inject('dbName')
      // equivalent of beforeEach
      const db = await getTestDb(dbName).transaction()

      // schedule the cleanup. Runs regardless of test status, and runs after afterEach.
      onTestFinished(async () => {
        await db.rollback()
      })

      // now run the test
      await use({ db })
    },
    { auto: true } // we want to run this for each databaseIntegrationTest, even if the context is not explicitly requested by the test
  ]
})

export interface E2ETestContext extends DatabaseIntegrationTestContext {
  context: {
    db: Knex.Transaction
    metricsServer: Server
  }
}

// vitest reference: https://vitest.dev/guide/test-context#fixture-initialization
export const e2eTest = test.extend<E2ETestContext>({
  // this key has to match the top level key in the interface (i.e. `context`). Some vitest typing magic at work here.
  context: [
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async ({ task, onTestFinished }, use) => {
      const dbName = inject('dbName')
      // equivalent of beforeEach
      const db = await getTestDb(dbName).transaction()
      const { metricsServer } = await startAndWaitOnServers()

      // schedule the cleanup. Runs regardless of test status, and runs after afterEach.
      onTestFinished(async () => {
        if (metricsServer) stopServer({ server: metricsServer })
        if (db) await db.rollback()
      })

      // now run the test
      await use({ db, metricsServer })
    },
    { auto: true } // we want to run this for each e2eTest, even if the context is not explicitly requested by the test
  ]
})
