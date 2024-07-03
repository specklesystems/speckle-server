import { stopServer } from '@/server/server.js'
import { test } from 'vitest'
import { getTestDb } from '#/helpers/testKnexClient.js'
import type {
  DatabaseIntegrationTestContext,
  E2ETestContext
} from '#/helpers/testContext.js'
import { buildAndStartServers } from '#/helpers/helpers.js'

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
      // equivalent of beforeEach
      const db = await getTestDb().transaction()
      const { server, metricsServer } = buildAndStartServers({ db })

      // now run the test
      await use({ db, server, metricsServer })

      // cleanup. Equivalent of afterEach.
      stopServer({ server })
      stopServer({ server: metricsServer })
      await db.rollback()
    },
    { auto: true } // we want to run this for each e2eTest, even if the context is not explicitly requested by the test
  ]
})
