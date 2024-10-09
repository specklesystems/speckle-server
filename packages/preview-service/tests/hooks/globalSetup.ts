/**
 * These hooks are run once, before and after the test suite.
 * It is configured via the vitest.config.ts file.
 */
import '@/bootstrap.js' // This has side-effects and has to be imported first
import { getTestDb } from '#/helpers/testKnexClient.js'
import { down, up } from '#/migrations/migrations.js'
import { testLogger as logger } from '@/observability/logging.js'
import cryptoRandomString from 'crypto-random-string'
import type { GlobalSetupContext } from 'vitest/node'

declare module 'vitest' {
  export interface ProvidedContext {
    dbName: string
  }
}

const dbName =
  process.env.TEST_DB || // in the acceptance tests we need to use a database name that is known prior to the test running
  `preview_service_${cryptoRandomString({
    length: 10,
    type: 'alphanumeric'
  })}`.toLocaleLowerCase() //postgres will automatically lower case new db names
let isDatabaseCreatedExternally = true

/**
 * Global setup hook
 * This hook is run once before any tests are run
 * Defined in vitest.config.ts under test.globalSetup
 */
export async function setup({ provide }: GlobalSetupContext) {
  logger.info('🏃🏻‍♀️‍➡️ Running vitest setup global hook')
  const superUserDbClient = getTestDb()
  const dbAlreadyExists = await superUserDbClient('pg_database')
    .select('datname')
    .where('datname', dbName)
  if (!dbAlreadyExists.length) {
    isDatabaseCreatedExternally = false
    await superUserDbClient.raw(`CREATE DATABASE ${dbName}
    WITH
    OWNER = preview_service_test
    ENCODING = 'UTF8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;`)
  }
  await superUserDbClient.destroy() // need to explicitly close the connection in clients to prevent hanging tests

  // this provides the dbName to all tests, and can be accessed via inject('dbName'). NB: The test extensions already implement this, so use a test extension.
  provide('dbName', dbName)

  const db = getTestDb(dbName)
  await up(db) //we need the migration to occur in our new database, so cannot use knex's built in migration functionality.
  await db.destroy() // need to explicitly close the connection in clients to prevent hanging tests
  logger.info(
    `💁🏽‍♀️ Completed the vitest setup global hook. Database created at ${dbName}`
  )
}

/**
 * Global teardown hook
 * This hook is run once after all tests are run
 * Defined in vitest.config.ts under test.globalTeardown
 */
export async function teardown() {
  logger.info('🏃🏻‍♀️ Running vitest teardown global hook')
  const db = getTestDb(dbName)
  await down(db) //we need the migration to occur in our named database, so cannot use knex's built in migration functionality.
  await db.destroy() // need to explicitly close the connection in clients to prevent hanging tests

  if (!isDatabaseCreatedExternally) {
    //use connection without database to drop the db
    const superUserDbClient = getTestDb()
    await superUserDbClient.raw(`DROP DATABASE ${dbName};`)
    await superUserDbClient.destroy() // need to explicitly close the connection in clients to prevent hanging tests
  }
  logger.info(
    `✅ Completed the vitest teardown global hook. Destroyed database at ${dbName}`
  )
}
