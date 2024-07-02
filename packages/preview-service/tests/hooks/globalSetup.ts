/**
 * These hooks are run once, before and after the test suite.
 * It is configured via the vitest.config.ts file.
 */

import { getTestDb } from '#/testKnex'
import { testLogger as logger } from '@/observability/logging'
import { truncateTables } from '#/hooks/helpers'

const testDb = getTestDb()

/**
 * Global setup hook
 * This hook is run once before any tests are run
 * Defined in vitest.config.ts under test.globalSetup
 */
export async function setup() {
  logger.info('🏃🏻‍♀️‍➡️ Running vitest setup global hook')
  const db = testDb
  await truncateTables({ db })
  await db.migrate.rollback()
  await db.migrate.latest()
  // await init() // app currently has no init function that needs to run prior to the server starting
  logger.info('💁🏽‍♀️ Completed the vitest setup global hook')
}

/**
 * Global teardown hook
 * This hook is run once after all tests are run
 * Defined in vitest.config.ts under test.globalTeardown
 */
export async function teardown() {
  logger.info('🏃🏻‍♀️ Running vitest teardown global hook')
  const db = testDb
  await truncateTables({ db })
  await db.migrate.rollback()
  await db.destroy() // need to explicitly close the connection in clients to prevent hanging tests
  // await shutdown() // the app currently has no shutdown function that needs to run to cleanly stop the server
  logger.info('✅ Completed the vitest teardown global hook')
}
