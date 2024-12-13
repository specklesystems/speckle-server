import { knexLogger as logger } from '@/observability/logging.js'
import {
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

let dbClients: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: Knex<any, any[]> | undefined
  isMain: boolean
  regionKey: string
}[]

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
          connectionUri: getPostgresConnectionString()
        }
      },
      configArgs
    )
    dbClients = [{ client: mainClient.private, regionKey: 'main', isMain: true }]
  } else {
    const configPath = process.env.MULTI_REGION_CONFIG_PATH || 'multiregion.json'
    const config = await loadMultiRegionsConfig({ path: configPath })
    const clients: [string, { public: Knex; private?: Knex }][] = [
      ['main', configureKnexClient(config.main, configArgs)]
    ]
    Object.entries(config.regions).map(([key, config]) => {
      clients.push([key, configureKnexClient(config, configArgs)])
    })

    dbClients = [
      ...clients.map(([regionKey, c]) => ({
        client: isDevOrTestEnv() ? c.public : c.private, //this has to be the private client in production, as we need to get the database name from the connection string. The public client, if via a connection pool, does not has the connection pool name not the database name.
        isMain: regionKey === 'main',
        regionKey
      }))
    ]
  }
  return dbClients
}
