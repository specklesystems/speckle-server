/**
 * These hooks are run once, before and after the test suite.
 * It is configured via the vitest.config.ts file.
 */
import '@/bootstrap.js' // This has side-effects and has to be imported first
import { testLogger as logger } from '@/observability/logging.js'
import cryptoRandomString from 'crypto-random-string'
import type { GlobalSetupContext } from 'vitest/node'

declare module 'vitest' {
  export interface ProvidedContext {
    dbName: string
  }
}

const dbName =
  process.env.TEST_DB ||
  `preview_service_${cryptoRandomString({
    length: 10,
    type: 'alphanumeric'
  })}`.toLocaleLowerCase() //postgres will automatically lower case new db names

/**
 * Global setup hook
 * This hook is run once before any tests are run
 * Defined in vitest.config.ts under test.globalSetup
 */
export function setup({ provide }: GlobalSetupContext) {
  logger.info('🏃🏻‍♀️‍➡️ Running vitest setup global hook')

  // this provides the dbName to all tests, and can be accessed via inject('dbName'). NB: The test extensions already implement this, so use a test extension.
  provide('dbName', dbName)

  logger.info(
    `💁🏽‍♀️ Completed the vitest setup global hook. Database created at ${dbName}`
  )
}

/**
 * Global teardown hook
 * This hook is run once after all tests are run
 * Defined in vitest.config.ts under test.globalTeardown
 */
export function teardown() {
  logger.info('🏃🏻‍♀️ Running vitest teardown global hook')

  logger.info(
    `✅ Completed the vitest teardown global hook. Database ${dbName} down migrated.`
  )
}
