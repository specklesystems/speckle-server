/* eslint-disable no-restricted-imports */
/* eslint-disable camelcase */
/* istanbul ignore file */
import { packageRoot } from './bootstrap'
import fs from 'fs'
import path from 'path'
import {
  isTestEnv,
  ignoreMissingMigrations,
  postgresMaxConnections,
  isDevOrTestEnv
} from '@/modules/shared/helpers/envHelper'
import { dbLogger as logger } from './logging/logging'
import { Knex } from 'knex'

function walk(dir: string) {
  let results: string[] = []
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
  }/${encodeURIComponent(env.POSTGRES_DB as string)}`
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

export const createKnexConfig = ({
  connectionString,
  caCertificate
}: {
  connectionString?: string
  caCertificate?: string | undefined
}): Knex.Config => {
  return {
    client: 'pg',
    migrations: {
      extension: 'ts',
      loadExtensions: isTestEnv() ? ['.js', '.ts'] : ['.js'],
      directory: migrationDirs
    },
    log: {
      warn(message: unknown) {
        logger.warn(message)
      },
      error(message: unknown) {
        logger.error(message)
      },
      deprecate(message: unknown) {
        logger.info(message)
      },
      debug(message: unknown) {
        logger.debug(message)
      }
    },
    connection: {
      connectionString,
      ssl: caCertificate ? { ca: caCertificate, rejectUnauthorized: true } : undefined,
      application_name: 'speckle_server'
    },
    // we wish to avoid leaking sql queries in the logs: https://knexjs.org/guide/#compilesqlonerror
    compileSqlOnError: isDevOrTestEnv(),
    asyncStackTraces: isDevOrTestEnv(),
    pool: {
      min: 0,
      max: postgresMaxConnections(),
      acquireTimeoutMillis: 16000, //allows for 3x creation attempts plus idle time between attempts
      createTimeoutMillis: 5000
    }
  }
}

const config: Record<string, Knex.Config> = {
  test: {
    ...createKnexConfig({
      connectionString: connectionUri || 'postgres://127.0.0.1/speckle2_test'
    })
  },
  development: {
    ...createKnexConfig({
      connectionString: connectionUri || 'postgres://127.0.0.1/speckle2_dev'
    })
  },
  production: {
    ...createKnexConfig({
      connectionString: connectionUri
    })
  }
}

export default config
