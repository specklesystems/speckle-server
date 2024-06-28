import { startServer } from '../server/server'
import { getTestDb } from './testKnex'
import { testLogger as logger } from '../observability/logging'
import type { Knex } from 'knex'

const testDb = getTestDb()

const truncateTables = async (params: { db: Knex; tableNames?: string[] }) => {
  const { db } = params
  let { tableNames } = params

  if (!tableNames?.length) {
    //why is server config only created once!????
    // because its done in a migration, to not override existing configs
    const protectedTables = ['server_config']
    // const protectedTables = [ 'server_config', 'user_roles', 'scopes', 'server_acl' ]
    tableNames = (
      await db('pg_tables')
        .select('tablename')
        .where({ schemaname: 'public' })
        .whereRaw("tablename not like '%knex%'")
        .whereNotIn('tablename', protectedTables)
    ).map((table: { tablename: string }) => table.tablename)
  }

  if (!tableNames || !tableNames.length) return

  await db.raw(`truncate table ${tableNames.join(',')} cascade`)
}

const buildAndStartApp = async (deps: { db: Knex }) => {
  const { db } = deps
  const { app, server, metricsServer } = await startServer({ db })
  return { app, server, metricsServer }
}

export const beforeEachContext = async (params: { db: Knex }) => {
  const { db } = params
  await truncateTables({ db })
  return await buildAndStartApp({ db })
}

/**
 * Global setup hook
 * This hook is run once before any tests are run
 * Defined in vitest.config.ts under test.globalSetup
 */
export async function setup() {
  logger.info('🏃🏻‍♀️‍➡️ Running vitest setup hook')
  const db = testDb
  await truncateTables({ db })
  await db.migrate.rollback()
  await db.migrate.latest()
  // await init() // app currently has no init function that needs to run prior to the server starting
}

/**
 * Global teardown hook
 * This hook is run once after all tests are run
 * Defined in vitest.config.ts under test.globalTeardown
 */
export async function teardown() {
  logger.info('🏃🏻‍♀️ Running vitest teardown hook')
  const db = testDb
  await truncateTables({ db })
  await db.migrate.rollback()
  await db.destroy() // need to explicitly close the connection in clients to prevent hanging tests
  // await shutdown() // the app currently has no shutdown function that needs to run to cleanly stop the server
  logger.info('🚮 Finished vitest teardown hook')
}
