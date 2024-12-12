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

const { FF_WORKSPACES_MULTI_REGION_ENABLED } = Environment.getFeatureFlags()

type ConfiguredKnexClient = ReturnType<typeof configureKnexClient>
export type DbClients = Record<'main', ConfiguredKnexClient> &
  Record<string, ConfiguredKnexClient>
let dbClients: DbClients

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
    dbClients = { main: mainClient }
  } else {
    const configPath = process.env.MULTI_REGION_CONFIG_PATH || 'multiregion.json'
    const config = await loadMultiRegionsConfig({ path: configPath })
    const clients = [['main', configureKnexClient(config.main, configArgs)]]
    Object.entries(config.regions).map(([key, config]) => {
      clients.push([key, configureKnexClient(config, configArgs)])
    })
    dbClients = Object.fromEntries(clients) as DbClients
  }
  return dbClients
}
