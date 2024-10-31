require('../bootstrap')

// Register global mocks as early as possible
require('@/test/mocks/global')

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const chaiHttp = require('chai-http')
const deepEqualInAnyOrder = require('deep-equal-in-any-order')
const { knex } = require(`@/db/knex`)
const { init, startHttp, shutdown } = require(`@/app`)
const { default: graphqlChaiPlugin } = require('@/test/plugins/graphql')
const { logger } = require('@/logging/logging')
const { once } = require('events')

// Register chai plugins
chai.use(chaiAsPromised)
chai.use(chaiHttp)
chai.use(deepEqualInAnyOrder)
chai.use(graphqlChaiPlugin)

const unlock = async () => {
  const exists = await knex.schema.hasTable('knex_migrations_lock')
  if (exists) {
    await knex('knex_migrations_lock').update('is_locked', '0')
  }
}

exports.truncateTables = async (tableNames) => {
  if (!tableNames?.length) {
    //why is server config only created once!????
    // because its done in a migration, to not override existing configs
    const protectedTables = ['server_config']
    // const protectedTables = [ 'server_config', 'user_roles', 'scopes', 'server_acl' ]
    tableNames = (
      await knex('pg_tables')
        .select('tablename')
        .where({ schemaname: 'public' })
        .whereRaw("tablename not like '%knex%'")
        .whereNotIn('tablename', protectedTables)
    ).map((table) => table.tablename)

    // We're deleting everything, so lets turn off triggers to avoid deadlocks/slowdowns
    await knex.transaction(async (trx) => {
      await trx.raw(`
        -- Disable triggers and foreign key constraints for this session
        SET session_replication_role = replica;
        
        truncate table ${tableNames.join(',')} cascade;

        -- Re-enable triggers and foreign key constraints
        SET session_replication_role = DEFAULT;
      `)
    })
  } else {
    await knex.raw(`truncate table ${tableNames.join(',')} cascade`)
  }
}

/**
 * @param {import('http').Server} server
 * @param {import('express').Express} app
 */
const initializeTestServer = async (server, app) => {
  await startHttp(server, app, 0)

  await once(app, 'appStarted')
  const port = server.address().port
  const serverAddress = `http://127.0.0.1:${port}`
  const wsAddress = `ws://127.0.0.1:${port}`
  return {
    server,
    serverAddress,
    serverPort: port,
    wsAddress,
    sendRequest(auth, obj) {
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

exports.mochaHooks = {
  beforeAll: async () => {
    logger.info('running before all')
    await unlock()
    await exports.truncateTables()
    await knex.migrate.rollback()
    await knex.migrate.latest()
    await init()
  },
  afterAll: async () => {
    logger.info('running after all')
    await unlock()
    await shutdown()
  }
}

exports.buildApp = async () => {
  const { app, graphqlServer, server } = await init()
  return { app, graphqlServer, server }
}

exports.beforeEachContext = async () => {
  await exports.truncateTables()
  return await exports.buildApp()
}

exports.initializeTestServer = initializeTestServer
