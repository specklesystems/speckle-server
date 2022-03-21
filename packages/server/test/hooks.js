/* istanbul ignore file */
require('../bootstrap')
const chai = require('chai')
const chaiHttp = require('chai-http')
const knex = require(`@/db/knex`)
const { init, startHttp } = require(`@/app`)

chai.use(chaiHttp)

const unlock = async () => {
  const exists = await knex.schema.hasTable('knex_migrations_lock')
  if (exists) {
    await knex('knex_migrations_lock').update('is_locked', '0')
  }
}

const truncateTables = async () => {
  //why is server config only created once!????
  const protectedTables = ['server_config']
  // const protectedTables = [ 'server_config', 'user_roles', 'scopes', 'server_acl' ]
  const tables = (
    await knex('pg_tables')
      .select('tablename')
      .where({ schemaname: 'public' })
      .whereRaw("tablename not like '%knex%'")
      .whereNotIn('tablename', protectedTables)
  ).map((table) => table.tablename)
  await knex.raw(`truncate table ${tables.join(',')} cascade`)
}

const initializeTestServer = async (app) => {
  let serverAddress
  let wsAddress
  const { server } = await startHttp(app, 0)

  app.on('appStarted', () => {
    const port = server.address().port
    serverAddress = `http://localhost:${port}`
    wsAddress = `ws://localhost:${port}`
  })
  while (!serverAddress) {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  return {
    server,
    serverAddress,
    wsAddress,
    sendRequest(auth, obj) {
      return chai.request(serverAddress).post('/graphql').set('Authorization', auth).send(obj)
    }
  }
}

exports.mochaHooks = {
  beforeAll: async () => {
    await unlock()
    await knex.migrate.rollback()
    await knex.migrate.latest()
    console.log('running before all')
  },
  afterAll: async () => {
    await unlock()
    await knex.migrate.rollback()
    console.log('running after all')
  }
}

exports.beforeEachContext = async () => {
  await truncateTables()
  const { app } = await init()
  return { app }
}

exports.initializeTestServer = initializeTestServer
