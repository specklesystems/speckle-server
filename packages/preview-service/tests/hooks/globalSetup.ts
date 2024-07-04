/**
 * These hooks are run once, before and after the test suite.
 * It is configured via the vitest.config.ts file.
 */

import { getTestDb } from '#/helpers/testKnexClient.js'
import { down, up } from '#/migrations/testPreviewService.js'
import { testLogger as logger } from '@/observability/logging.js'
import cryptoRandomString from 'crypto-random-string'
import type { GlobalSetupContext } from 'vitest/node'
import dotenv from 'dotenv'

declare module 'vitest' {
  export interface ProvidedContext {
    dbName: string
  }
}

const dbName = `preview_service_${cryptoRandomString({
  length: 10,
  type: 'alphanumeric'
})}`.toLocaleLowerCase() //postgres will automatically lower case new db names

/**
 * Global setup hook
 * This hook is run once before any tests are run
 * Defined in vitest.config.ts under test.globalSetup
 */
export async function setup({ provide }: GlobalSetupContext) {
  logger.info('🏃🏻‍♀️‍➡️ Running vitest setup global hook')
  dotenv.config()
  const dbWithUnspecifiedDatabase = getTestDb()
  await dbWithUnspecifiedDatabase.raw(`CREATE DATABASE ${dbName}
    WITH
    OWNER = preview_service_test
    ENCODING = 'UTF8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;`)
  await dbWithUnspecifiedDatabase.destroy()

  // this provides the dbName to all tests, and can be accessed via inject('dbName'). NB: The test extensions already implement this, so use a test extension.
  provide('dbName', dbName)

  const db = getTestDb(dbName)
  await up(db) //HACK call migration directly because knex.migrate is not playing ball with typescript
  await db.destroy() // need to explicitly close the connection in clients to prevent hanging tests

  // await db.migrate.rollback()
  // await db.migrate.latest()
  logger.info('💁🏽‍♀️ Completed the vitest setup global hook')
}

/**
 * Global teardown hook
 * This hook is run once after all tests are run
 * Defined in vitest.config.ts under test.globalTeardown
 */
export async function teardown() {
  logger.info('🏃🏻‍♀️ Running vitest teardown global hook')
  const db = getTestDb(dbName)
  await down(db) //HACK call migration directly
  await db.destroy() // need to explicitly close the connection in clients to prevent hanging tests

  //use connection without database to drop the db
  const dbWithoutDatabase = getTestDb()
  await dbWithoutDatabase.raw(`DROP DATABASE ${dbName};`)
  await dbWithoutDatabase.destroy() // need to explicitly close the connection in clients to prevent hanging tests
  // await db.migrate.rollback()
  logger.info('✅ Completed the vitest teardown global hook')
}
