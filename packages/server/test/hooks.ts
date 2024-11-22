// eslint-disable-next-line no-restricted-imports
import '../bootstrap'

// Register global mocks as early as possible
import '@/test/mocks/global'

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import chaiHttp from 'chai-http'
import deepEqualInAnyOrder from 'deep-equal-in-any-order'
import { knex as mainDb } from '@/db/knex'
import { init, startHttp, shutdown } from '@/app'
import graphqlChaiPlugin from '@/test/plugins/graphql'
import { logger } from '@/logging/logging'
import { once } from 'events'
import type http from 'http'
import type express from 'express'
import type net from 'net'
import { MaybeAsync, MaybeNullOrUndefined, wait } from '@speckle/shared'
import type mocha from 'mocha'
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
} from '@/modules/multiregion/dbSelector'
import { Knex } from 'knex'
import { isMultiRegionTestMode } from '@/test/speckle-helpers/regions'
import { isMultiRegionEnabled } from '@/modules/multiregion/helpers'
import { GraphQLContext } from '@/modules/shared/helpers/typeHelper'
import { ApolloServer } from '@apollo/server'
import { ReadinessHandler } from '@/healthchecks/health'

// why is server config only created once!????
// because its done in a migration, to not override existing configs
// similarly wiping regions will break multi region setup
const protectedTables = ['server_config', 'regions']
let regionClients: Record<string, Knex> = {}

// Register chai plugins
chai.use(chaiAsPromised)
chai.use(chaiHttp)
chai.use(deepEqualInAnyOrder)
chai.use(graphqlChaiPlugin)

const inEachDb = async (fn: (db: Knex) => MaybeAsync<void>) => {
  await fn(mainDb)
  for (const regionClient of Object.values(regionClients)) {
    await fn(regionClient)
  }
}

const ensureAivenExtrasFactory = (deps: { db: Knex }) => async () => {
  await deps.db.raw('CREATE EXTENSION IF NOT EXISTS "aiven_extras";')
}

const setupMultiregionMode = async () => {
  const db = mainDb
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
    initializeRegion
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

  // Reset each DB client (re-run all migrations and setup)
  for (const [, regionClient] of Object.entries(regionClients)) {
    const reset = resetSchemaFactory({ db: regionClient })
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

export const resetPubSubFactory = (deps: { db: Knex }) => async () => {
  // We wanna reset even outside of multiregion test mode, as long as multi region is generally enabled
  if (!isMultiRegionEnabled()) {
    return { drop: async () => {}, reenable: async () => {} }
  }

  const ensureAivenExtras = ensureAivenExtrasFactory(deps)
  await ensureAivenExtras()

  type SubInfo = {
    subname: string
    subconninfo: string
    subpublications: string[]
    subslotname: string
  }

  const subscriptions = (await deps.db.raw(
    `SELECT subname, subconninfo, subpublications, subslotname FROM aiven_extras.pg_list_all_subscriptions() WHERE subname ILIKE 'test_%';`
  )) as {
    rows: Array<SubInfo>
  }
  const publications = (await deps.db.raw(
    `SELECT pubname FROM pg_publication WHERE pubname ILIKE 'test_%';`
  )) as {
    rows: Array<{ pubname: string }>
  }

  const dropSubs = async (info: SubInfo) => {
    await deps.db.raw(
      `SELECT * FROM aiven_extras.pg_alter_subscription_disable('${info.subname}');`
    )
    await wait(500)
    await deps.db.raw(
      `SELECT * FROM aiven_extras.pg_drop_subscription('${info.subname}');`
    )
    await wait(1000)
    await deps.db.raw(
      `SELECT * FROM aiven_extras.dblink_slot_create_or_drop('${info.subconninfo}', '${info.subslotname}', 'drop');`
    )
  }

  // Drop all subs
  // (concurrently, cause it seems possible and we have those delays there)
  await Promise.all(subscriptions.rows.map(dropSubs))

  // Drop all pubs
  for (const pub of publications.rows) {
    await deps.db.raw(`DROP PUBLICATION ${pub.pubname};`)
  }
}

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
    await deps.db.transaction(async (trx) => {
      await trx.raw(`
        -- Disable triggers and foreign key constraints for this session
        SET session_replication_role = replica;

        truncate table ${tableNames?.join(',') || ''};

        -- Re-enable triggers and foreign key constraints
        SET session_replication_role = DEFAULT;
      `)
    })
  } else {
    await deps.db.raw(`truncate table ${tableNames.join(',')} cascade`)
  }
}

const resetSchemaFactory = (deps: { db: Knex }) => async () => {
  const resetPubSub = resetPubSubFactory(deps)

  await unlockFactory(deps)()
  await resetPubSub()

  // Reset schema
  await deps.db.migrate.rollback()
  await deps.db.migrate.latest()
}

export const truncateTables = async (tableNames?: string[]) => {
  const dbs = [mainDb, ...Object.values(regionClients)]

  // First reset pubsubs
  for (const db of dbs) {
    const resetPubSub = resetPubSubFactory({ db })
    await resetPubSub()
  }

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

let graphqlServer: ApolloServer<GraphQLContext>

export const mochaHooks: mocha.RootHookObject = {
  beforeAll: async () => {
    if (isMultiRegionTestMode()) {
      console.log('Running tests in multi-region mode...')
    }

    logger.info('running before all')

    // Init main db
    const reset = resetSchemaFactory({ db: mainDb })
    await reset()

    // Init (or cleanup) multi-region mode
    await setupMultiregionMode()

    // Init app
    ;({ graphqlServer } = await init())
  },
  afterAll: async () => {
    logger.info('running after all')
    await inEachDb(async (db) => {
      await unlockFactory({ db })()
    })
    await shutdown({ graphqlServer })
  }
}

export const buildApp = async () => {
  return await init()
}

export const beforeEachContext = async () => {
  await truncateTables()
  return await buildApp()
}
