import { stopServer } from '@/server/server.js'
import { test } from 'vitest'
import { getTestDb } from '#/helpers/testKnexClient.js'
import type {
  DatabaseIntegrationTestContext,
  E2ETestContext
} from '#/helpers/testContext.js'
import { buildAndStartServers } from '#/helpers/helpers.js'
import http from 'http'
import type { Knex } from 'knex'

// vitest reference: https://vitest.dev/guide/test-context#fixture-initialization
export const databaseIntegrationTest = test.extend<DatabaseIntegrationTestContext>({
  context: [
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async ({ task }, use) => {
      // equivalent of beforeEach
      const db = await getTestDb().transaction()

      // now run the test
      await use({ db })

      // cleanup. Equivalent of afterEach.
      await db.rollback()
    },
    { auto: true } // we want to run this for each databaseIntegrationTest, even if the context is not explicitly requested by the test
  ]
})

// vitest reference: https://vitest.dev/guide/test-context#fixture-initialization
export const e2eTest = test.extend<E2ETestContext>({
  context: [
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async ({ task }, use) => {
      let server: http.Server | null = null
      let metricsServer: http.Server | null = null
      let db: Knex.Transaction | null = null
      try {
        // equivalent of beforeEach
        db = await getTestDb().transaction()
        ;({ server, metricsServer } = await buildAndStartServers({ db }))

        // now run the test
        await use({ db, server, metricsServer })
      } catch (e) {
        // cleanup after throwing. Equivalent of afterEach.
        if (server) stopServer({ server })
        if (metricsServer) stopServer({ server: metricsServer })
        if (db) await db.rollback()
        throw e
      }

      // if it didn't throw, we still need to cleanup. Equivalent of afterEach.
      if (server) stopServer({ server })
      if (metricsServer) stopServer({ server: metricsServer })
      if (db) await db.rollback()
    },
    { auto: true } // we want to run this for each e2eTest, even if the context is not explicitly requested by the test
  ]
})
