/**
 * This file is run before each spec file.
 * It is configured via the vitest.config.ts file.
 */
//FIXME this is only relevant for integration tests... not unit tests

import { buildAndStartApp, truncateTables } from '#/hooks/helpers.js'
import { getTestDb } from '#/testKnex.js'
import { testLogger as logger } from '@/observability/logging.js'
import { stopServer } from '@/server/server.js'
import http from 'http'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'

const testDb = getTestDb()
let server: http.Server

beforeAll(() => {
  const db = testDb
  logger.info('🏃🏻‍♀️ Running vitest beforeEach hook')
  // const db = testDb
  ;({ server } = buildAndStartApp({ db }))
  logger.info('▶️ Completed the vitest beforeEach hook')
})

beforeEach(async () => {
  logger.info('🏃🏻‍♀️ Running vitest beforeEach hook')
  await truncateTables({ db: testDb })
  const db = await testDb.transaction()
  ;({ server } = buildAndStartApp({ db }))
  logger.info('▶️ Completed the vitest beforeEach hook')
})

afterEach(async () => {
  logger.info('🏃🏻‍♀️ Running vitest afterEach hook')
  const db = testDb
  await truncateTables({ db })
  stopServer({ server })

  logger.info('▶️ Completed the vitest afterEach hook')
})

afterAll(() => {
  logger.info('🏃🏻‍♀️ Running vitest afterAll hook')
  stopServer({ server })
  logger.info('▶️ Completed the vitest afterAll hook')
})
