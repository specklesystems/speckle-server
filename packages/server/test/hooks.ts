/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-restricted-imports */
import '../bootstrap.js'

// Register global mocks as early as possible
import '@/test/mocks/global'

import chaiAsPromised from 'chai-as-promised'
import chaiHttp from 'chai-http'
import deepEqualInAnyOrder from 'deep-equal-in-any-order'
import graphqlChaiPlugin from '@/test/plugins/graphql'
import { knex as mainDb } from '@/db/knex'
import chai from 'chai'
import { init, startHttp, shutdown } from '@/app'
import { testLogger as logger } from '@/observability/logging'
import { once } from 'events'
import type http from 'http'
import type express from 'express'
import type net from 'net'
import type { MaybeAsync, MaybeNullOrUndefined, Nullable } from '@speckle/shared'
import { ensureError, retry } from '@speckle/shared'
import {
  getAvailableRegionKeysFactory,
  getFreeRegionKeysFactory
} from '@/modules/multiregion/services/config'
import { getAvailableRegionConfig } from '@/modules/multiregion/regionConfig'
import { createAndValidateNewRegionFactory } from '@/modules/multiregion/services/management'
import {
  getRegionFactory,
  getRegionsFactory,
  Regions,
  storeRegionFactory
} from '@/modules/multiregion/repositories'
import {
  getRegisteredRegionClients,
  initializeRegion
} from '@/modules/multiregion/utils/dbSelector'
import type { Knex } from 'knex'
import { isMultiRegionTestMode } from '@/test/speckle-helpers/regions'
import type { GraphQLContext } from '@/modules/shared/helpers/typeHelper'
import type { ApolloServer } from '@apollo/server'
import type { ReadinessHandler } from '@/healthchecks/types'
import { set } from 'lodash-es'
import { fixStackTrace } from '@/test/speckle-helpers/error'
import { EnvironmentResourceError } from '@/modules/shared/errors'
import * as mocha from 'mocha'
import { getStalePreparedTransactionsFactory } from '@/modules/multiregion/repositories/transactions'
import { rollbackPreparedTransaction } from '@/modules/shared/helpers/dbHelper'

// Register chai plugins
chai.use(chaiAsPromised)
chai.use(chaiHttp)
chai.use(deepEqualInAnyOrder)
chai.use(graphqlChaiPlugin)

// why is server config only created once!????
// because its done in a migration, to not override existing configs
// similarly wiping regions will break multi region setup
const protectedTables = ['server_config', 'regions']
let regionClients: Record<string, Knex> = {}

// Please forgive me god for what I'm about to do, but Mocha's ancient API sucks ass
// and there's NO OTHER WAY to format errors across all reporters
const originalMochaRun = mocha.default.prototype.run
set(mocha.default.prototype, 'run', function (this: any, ...args: any) {
  const runner = originalMochaRun.apply(this, args)
  runner.prependListener(mocha.Runner.constants.EVENT_TEST_FAIL, (_test, err) => {
    fixStackTrace(err)
  })

  return runner
})

export const getMainTestRegionKey = () => {
  const key = Object.keys(regionClients)[0]
  if (!key) {
    throw new Error('No registered region client found')
  }

  return key
}

export const getMainTestRegionKeyIfMultiRegion = () => {
  const isMultiRegionMode = isMultiRegionTestMode()
  return isMultiRegionMode ? getMainTestRegionKey() : undefined
}

export const getMainTestRegionClient = () => {
  const key = getMainTestRegionKey()
  const client = regionClients[key]
  if (!client) {
    throw new Error('No registered region client found')
  }

  return client
}

const inEachDb = async (fn: (db: Knex) => MaybeAsync<void>) => {
  await fn(mainDb)
  for (const regionClient of Object.values(regionClients)) {
    await fn(regionClient)
  }
}

const setupDatabases = async () => {
  // First reset main db
  const db = mainDb
  const resetMainDb = resetSchemaFactory({ db, regionKey: null })
  await resetMainDb()

  const getAvailableRegionKeys = getAvailableRegionKeysFactory({
    getAvailableRegionConfig
  })
  const regionKeys = await getAvailableRegionKeys()

  // Create DB region entries for each key
  const createRegion = createAndValidateNewRegionFactory({
    getFreeRegionKeys: getFreeRegionKeysFactory({
      getAvailableRegionKeys,
      getRegions: getRegionsFactory({ db })
    }),
    getRegion: getRegionFactory({ db }),
    storeRegion: storeRegionFactory({ db }),
    initializeRegion,
    // As db starts from scratch, no need to sync regions
    scheduleJob: () => Promise.resolve('')
  })
  for (const regionKey of regionKeys) {
    await createRegion({
      region: {
        key: regionKey,
        name: regionKey,
        description: 'Auto created test region'
      }
    })
  }

  // Store active region clients
  regionClients = await getRegisteredRegionClients()

  // Reset each region DB client (re-run all migrations and setup)
  for (const [regionKey, db] of Object.entries(regionClients)) {
    const reset = resetSchemaFactory({ db, regionKey })
    await reset()
  }

  // If not in multi region mode, delete region entries
  // we only needed them to reset schemas
  if (!isMultiRegionTestMode()) {
    await truncateTables([Regions.name])
    regionClients = {}
  }
}

const unlockFactory = (deps: { db: Knex }) => async () => {
  const exists = await deps.db.schema.hasTable('knex_migrations_lock')
  if (exists) {
    await deps.db('knex_migrations_lock').update('is_locked', '0')
  }
}

export const getRegionKeys = () => Object.keys(regionClients)

const truncateTablesFactory = (deps: { db: Knex }) => async (tableNames?: string[]) => {
  if (!tableNames?.length) {
    tableNames = (
      await deps
        .db('pg_tables')
        .select('tablename')
        .where({ schemaname: 'public' })
        .whereRaw("tablename not like '%knex%'")
        .whereNotIn('tablename', protectedTables)
    ).map((table: { tablename: string }) => table.tablename)
    if (!tableNames.length) return // Nothing to truncate

    // We're deleting everything, so lets turn off triggers to avoid deadlocks/slowdowns
    // This still seems to randomly cause deadlocks, so adding a retry
    await retry(
      async () =>
        await deps.db.transaction(async (trx) => {
          await trx.raw(`
        -- Disable triggers and foreign key constraints for this session
        SET session_replication_role = replica;

        truncate table ${tableNames?.join(',') || ''};

        -- Re-enable triggers and foreign key constraints
        SET session_replication_role = DEFAULT;
      `)
        }),
      3,
      200
    )
  } else {
    await deps.db.raw(`truncate table ${tableNames.join(',')} cascade`)
  }
}

const resetSchemaFactory =
  (deps: { db: Knex; regionKey: Nullable<string> }) => async () => {
    const { regionKey } = deps

    const truncate = truncateTablesFactory(deps)

    const pendingTransactions = await getStalePreparedTransactionsFactory({
      db: deps.db
    })({ interval: '1 second' })
    await Promise.all(
      pendingTransactions.map(({ gid }) => rollbackPreparedTransaction(deps.db, gid))
    )

    await unlockFactory(deps)()
    await truncate() // otherwise some rollbacks will fail

    // Reset schema
    try {
      await deps.db.migrate.rollback()
      await deps.db.migrate.latest()
    } catch (e) {
      throw new EnvironmentResourceError(
        `Failed to reset schema for ${
          regionKey ? 'region ' + regionKey + ' ' : 'main DB'
        }`,
        {
          cause: ensureError(e)
        }
      )
    }
  }

export const truncateTables = async (tableNames?: string[]) => {
  const dbs = [mainDb, ...Object.values(regionClients)]

  // Now truncate
  for (const db of dbs) {
    const truncate = truncateTablesFactory({ db })
    await truncate(tableNames)
  }
}

export const initializeTestServer = async (params: {
  server: http.Server
  app: express.Express
  graphqlServer: ApolloServer<GraphQLContext>
  readinessCheck: ReadinessHandler
  customPortOverride?: number
}) => {
  await startHttp({ ...params, customPortOverride: params.customPortOverride ?? 0 })
  const { server, app } = params

  await once(app, 'appStarted')
  const port = (server.address() as net.AddressInfo).port + ''
  const serverAddress = `http://127.0.0.1:${port}`
  const wsAddress = `ws://127.0.0.1:${port}`
  return {
    server,
    serverAddress,
    serverPort: port,
    wsAddress,
    sendRequest(auth: MaybeNullOrUndefined<string>, obj: string | object) {
      return (
        chai
          .request(serverAddress)
          .post('/graphql')
          // if you set the header to null, the actual header in the req will be
          // a string -> 'null'
          // this is now treated as an invalid token, and gets forbidden
          // switching to an empty string token
          .set('Authorization', auth || '')
          .send(obj)
      )
    }
  }
}

let builtApps: Array<Awaited<ReturnType<typeof init>>> = []

export const buildApp = async () => {
  const ret = await init()
  builtApps.push(ret)
  return ret
}

export const beforeEachContext = async () => {
  await truncateTables(undefined)
  return await buildApp()
}

export const shutdownAll = async () => {
  await Promise.all(
    builtApps.map(async ({ graphqlServer, server, subscriptionServer }) => {
      await graphqlServer.stop()
      server.closeAllConnections()
      subscriptionServer.close()
    })
  )
  builtApps = []
  await shutdown({ graphqlServer: undefined })
}

export const beforeEntireTestRun = async () => {
  if (isMultiRegionTestMode()) {
    logger.info('Running tests in multi-region mode...')
  }

  logger.info('🔧 Global setup: runs once before all tests')

  // Init (or cleanup) test databases
  await setupDatabases()

  // Init app
  await buildApp()
}

export const afterEntireTestRun = async () => {
  logger.info('🧹 Global teardown: runs once after all tests')

  await inEachDb(async (db) => {
    await unlockFactory({ db })()
  })
  await shutdownAll()
}

export const mochaHooks: mocha.RootHookObject = {
  beforeAll: beforeEntireTestRun,
  afterAll: afterEntireTestRun
}
