/**
 * These hooks are run once, before and after the test suite.
 * It is configured via the vitest.config.ts file.
 */

import { getTestDb } from '#/helpers/testKnexClient.js'
import { testLogger as logger } from '@/observability/logging.js'

const testDb = getTestDb()

/**
 * Global setup hook
 * This hook is run once before any tests are run
 * Defined in vitest.config.ts under test.globalSetup
 */
export async function setup() {
  logger.info('🏃🏻‍♀️‍➡️ Running vitest setup global hook')
  const db = testDb
  // await db.migrate.rollback()
  await db.migrate.latest()
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
  // await db.migrate.rollback()
  await db.destroy() // need to explicitly close the connection in clients to prevent hanging tests
  logger.info('✅ Completed the vitest teardown global hook')
}
