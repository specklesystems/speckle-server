/* eslint-disable camelcase */
/* istanbul ignore file */
'use strict'

const { packageRoot } = require('./bootstrap')
const fs = require('fs')
const path = require('path')
const {
  isTestEnv,
  ignoreMissingMigrations
} = require('@/modules/shared/helpers/envHelper')

function walk(dir) {
  let results = []
  const list = fs.readdirSync(dir)
  list.forEach(function (file) {
    const fullFile = path.join(dir, file)
    const stat = fs.statSync(fullFile)
    if (stat && stat.isDirectory()) {
      if (file === 'migrations') results.push(fullFile)
      else results = results.concat(walk(fullFile))
    }
  })
  return results
}

// Always read migrations from /dist, otherwise we risk the same migration being applied twice
// once with the .ts extension and the 2nd time with the .js one
// The only exception is when running tests in the test DB, cause the stakes are way lower there and we always
// run them through ts-node anyway, so it doesn't make sense forcing the app to be built
const migrationModulesDir = path.resolve(
  packageRoot,
  isTestEnv() ? './modules' : './dist/modules'
)
const migrationDirsExist = fs.existsSync(migrationModulesDir)
if (!migrationDirsExist && !ignoreMissingMigrations()) {
  throw new Error('App must be built into /dist, to enable work with migrations')
}

const migrationDirs = migrationDirsExist ? walk(migrationModulesDir) : []

// this is for readability, many users struggle to set the postgres connection uri
// in the env variables. This way its a bit easier to understand, also backward compatible.
const env = process.env
let connectionUri
if (env.POSTGRES_USER && env.POSTGRES_PASSWORD) {
  connectionUri = `postgres://${encodeURIComponent(
    env.POSTGRES_USER
  )}:${encodeURIComponent(env.POSTGRES_PASSWORD)}@${
    env.POSTGRES_URL
  }/${encodeURIComponent(env.POSTGRES_DB)}`
} else {
  connectionUri = env.POSTGRES_URL
}

// NOTE: fixes time pagination, breaks graphql DateTime parsing :/
// The pg driver (& knex?) parses dates for us and it breaks precision. This
// disables any date parsing and we guarantee values are returned as strings.
// const types = require('pg').types
// const TIMESTAMPTZ_OID = 1184
// const TIMESTAMP_OID = 1114
// types.setTypeParser(TIMESTAMPTZ_OID, (val) => val)
// types.setTypeParser(TIMESTAMP_OID, (val) => val)

// Another NOTE:
// this is why the new datetime columns are created like this
// table.specificType('createdAt', 'TIMESTAMPTZ(3)').defaultTo(knex.fn.now())

const postgresMaxConnections = parseInt(env.POSTGRES_MAX_CONNECTIONS_SERVER) || 4

/** @type {import('knex').Knex.Config} */
const commonConfig = {
  client: 'pg',
  migrations: {
    extension: 'ts',
    loadExtensions: isTestEnv() ? ['.js', '.ts'] : ['.js'],
    directory: migrationDirs
  },
  pool: { min: 0, max: postgresMaxConnections }
}

/** @type {Object<string, import('knex').Knex.Config>} */
const config = {
  test: {
    ...commonConfig,
    connection: {
      connectionString: connectionUri || 'postgres://127.0.0.1/speckle2_test',
      application_name: 'speckle_server'
    }
  },
  development: {
    ...commonConfig,
    connection: {
      connectionString: connectionUri || 'postgres://127.0.0.1/speckle2_dev',
      application_name: 'speckle_server'
    }
  },
  production: {
    ...commonConfig,
    connection: {
      connectionString: connectionUri,
      application_name: 'speckle_server'
    }
  }
}

module.exports = config
