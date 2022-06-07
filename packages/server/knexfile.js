/* istanbul ignore file */
'use strict'

require('./bootstrap')
const fs = require('fs')
const path = require('path')

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

const migrationDirs = walk(path.resolve(__dirname, './modules'))

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

/** @type {Object<string, import('knex').Knex.Config>} */
const config = {
  test: {
    client: 'pg',
    connection: connectionUri || 'postgres://localhost/speckle2_test',
    migrations: {
      directory: migrationDirs
    }
  },
  development: {
    client: 'pg',
    connection: connectionUri || 'postgres://localhost/speckle2_dev',
    migrations: {
      directory: migrationDirs
    },
    pool: { min: 2, max: 4 }
  },
  production: {
    client: 'pg',
    connection: connectionUri,
    migrations: {
      directory: migrationDirs
    },
    pool: { min: 2, max: 4 }
  }
}

module.exports = config
