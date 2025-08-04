/* eslint-disable no-restricted-imports */
/* istanbul ignore file */
import { packageRoot, isTsMode } from './bootstrap.js'
import fs from 'fs'
import path from 'path'
import {
  isTestEnv,
  ignoreMissingMigrations,
  postgresMaxConnections,
  isDevOrTestEnv,
  postgresConnectionAcquireTimeoutMillis,
  postgresConnectionCreateTimeoutMillis,
  knexAsyncStackTracesEnabled,
  isDevEnv
} from '@/modules/shared/helpers/envHelper'
import { dbLogger as logger } from '@/observability/logging'
import type { Knex } from 'knex'
import type { KnexConfigArgs, RegionServerConfig } from '@speckle/shared/environment/db'
import { createKnexConfig, configureKnexClient } from '@speckle/shared/environment/db'
import { SpeckleFsMigrations } from '@/modules/core/configs/knexMigrations.js'

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

// when running w/ TS, run migrations from source code, otherwise from dist
const migrationModulesDir = path.resolve(
  packageRoot,
  isTsMode ? './modules' : './dist/modules'
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

const configArgs: KnexConfigArgs = {
  migrationDirs,
  migrationSource: new SpeckleFsMigrations({ migrationDirs }),
  isTestEnv: isTestEnv(),
  isDevOrTestEnv: isDevOrTestEnv(),
  isDevEnv: isDevEnv(),
  applicationName: 'speckle_server',
  logger,
  maxConnections: postgresMaxConnections(),
  connectionAcquireTimeoutMillis: postgresConnectionAcquireTimeoutMillis(),
  connectionCreateTimeoutMillis: postgresConnectionCreateTimeoutMillis(),
  asyncStackTraces: knexAsyncStackTracesEnabled()
}

const config: Record<string, Knex.Config> = {
  test: {
    ...createKnexConfig({
      connectionString: connectionUri || 'postgres://127.0.0.1/speckle2_test',
      ...configArgs
    })
  },
  development: {
    ...createKnexConfig({
      connectionString: connectionUri || 'postgres://127.0.0.1/speckle2_dev',
      ...configArgs
    })
  },
  production: {
    ...createKnexConfig({
      connectionString: connectionUri,
      ...configArgs
    })
  }
}

export const configureClient = (config: Pick<RegionServerConfig, 'postgres'>) => {
  return configureKnexClient(config, configArgs)
}

export default config
