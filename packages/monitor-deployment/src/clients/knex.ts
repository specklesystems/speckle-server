import { knexLogger as logger } from '@/observability/logging.js'
import {
  getDatabaseName,
  getPostgresCACertificate,
  getPostgresConnectionString,
  getPostgresMaxConnections,
  isDevOrTestEnv,
  isTest
} from '@/utils/env.js'
import Environment from '@speckle/shared/dist/commonjs/environment/index.js'
import {
  loadMultiRegionsConfig,
  configureKnexClient
} from '@speckle/shared/dist/commonjs/environment/multiRegionConfig.js'
import { Knex } from 'knex'

const { FF_WORKSPACES_MULTI_REGION_ENABLED } = Environment.getFeatureFlags()

export type DbClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: Knex<any, any[]>
  isMain: boolean
  regionKey: string
  databaseName?: string
}

let dbClients: DbClient[]

export const getDbClients = async () => {
  if (dbClients) return dbClients
  const maxConnections = getPostgresMaxConnections()

  const configArgs = {
    migrationDirs: [],
    isTestEnv: isTest(),
    isDevOrTestEnv: isDevOrTestEnv(),
    logger,
    maxConnections,
    applicationName: 'speckle_database_monitor'
  }
  if (!FF_WORKSPACES_MULTI_REGION_ENABLED) {
    const mainClient = configureKnexClient(
      {
        postgres: {
          connectionUri: getPostgresConnectionString(),
          publicTlsCertificate: getPostgresCACertificate()
        }
      },
      configArgs
    )
    const databaseName =
      // try to get the database name from the environment variable, if not default to parsing the connection string
      getDatabaseName() ||
      new URL(getPostgresConnectionString()).pathname.split('/').pop()
    dbClients = [
      { client: mainClient.public, regionKey: 'main', isMain: true, databaseName }
    ]
  } else {
    const configPath = process.env.MULTI_REGION_CONFIG_PATH || 'multiregion.json'
    const config = await loadMultiRegionsConfig({ path: configPath })
    const clients: [string, { databaseName?: string; public: Knex; private?: Knex }][] =
      [
        [
          'main',
          {
            ...configureKnexClient(config.main, configArgs),
            databaseName: config.main.postgres.databaseName
          }
        ]
      ]
    Object.entries(config.regions).map(([key, config]) => {
      clients.push([
        key,
        {
          ...configureKnexClient(config, configArgs),
          databaseName: config.postgres.databaseName
        }
      ])
    })

    dbClients = [
      ...clients.map(([regionKey, c]) => ({
        client: c.public,
        isMain: regionKey === 'main',
        regionKey,
        databaseName: c.databaseName
      }))
    ]
  }
  return dbClients
}
