require('../bootstrap')

// Register global mocks as early as possible
require('@/test/mocks/global')

const chai = require('chai')
const chaiHttp = require('chai-http')
const deepEqualInAnyOrder = require('deep-equal-in-any-order')
const knex = require(`@/db/knex`)
const { init, startHttp, shutdown } = require(`@/app`)
const { default: graphqlChaiPlugin } = require('@/test/plugins/graphql')
const { logger } = require('@/logging/logging')

// Register chai plugins
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
    const protectedTables = ['server_config']
    // const protectedTables = [ 'server_config', 'user_roles', 'scopes', 'server_acl' ]
    tableNames = (
      await knex('pg_tables')
        .select('tablename')
        .where({ schemaname: 'public' })
        .whereRaw("tablename not like '%knex%'")
        .whereNotIn('tablename', protectedTables)
    ).map((table) => table.tablename)
  }

  await knex.raw(`truncate table ${tableNames.join(',')} cascade`)
}

/**
 * @param {import('http').Server} server
 * @param {import('express').Express} app
 */
const initializeTestServer = async (server, app) => {
  let serverAddress
  let wsAddress
  await startHttp(server, app, 0)

  app.on('appStarted', () => {
    const port = server.address().port
    serverAddress = `http://127.0.0.1:${port}`
    wsAddress = `ws://127.0.0.1:${port}`
  })
  while (!serverAddress) {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  return {
    server,
    serverAddress,
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
