/**
 * This file is run before each spec file.
 * It is configured via the vitest.config.ts file.
 */
//FIXME this is only relevant for integration tests... not unit tests

import { beforeAll, beforeEach, afterEach, afterAll } from 'vitest'
import { getTestDb } from '../testKnex'
import { testLogger as logger } from '../../observability/logging'
import { buildAndStartApp, truncateTables } from './helpers'
import { stopServer } from 'server/server'
import http from 'http'

const testDb = getTestDb()
let server: http.Server

beforeAll(async () => {
  const db = testDb
  logger.info('🏃🏻‍♀️ Running vitest beforeEach hook')
  // const db = testDb
  ;({ server } = await buildAndStartApp({ db }))
  logger.info('▶️ Completed the vitest beforeEach hook')
})

beforeEach(async () => {
  logger.info('🏃🏻‍♀️ Running vitest beforeEach hook')
  await truncateTables({ db: testDb })
  const db = await testDb.transaction()
  ;({ server } = await buildAndStartApp({ db }))
  logger.info('▶️ Completed the vitest beforeEach hook')
})

afterEach(async () => {
  logger.info('🏃🏻‍♀️ Running vitest afterEach hook')
  const db = testDb
  await truncateTables({ db })
  // await stopServer({ server })

  logger.info('▶️ Completed the vitest afterEach hook')
})

afterAll(async () => {
  logger.info('🏃🏻‍♀️ Running vitest afterAll hook')
  // await stopServer({ server })
  logger.info('▶️ Completed the vitest afterAll hook')
})
