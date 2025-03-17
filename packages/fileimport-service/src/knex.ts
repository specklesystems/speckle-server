import Environment from '@speckle/shared/dist/commonjs/environment/index.js'
import {
  loadMultiRegionsConfig,
  configureKnexClient
} from '@speckle/shared/dist/commonjs/environment/multiRegionConfig.js'
import { logger } from '@/observability/logging.js'
import { Knex } from 'knex'

const { FF_WORKSPACES_MULTI_REGION_ENABLED } = Environment.getFeatureFlags()

const isDevEnv = process.env.NODE_ENV !== 'production'

type DbClient = { public: Knex; private?: Knex }
let dbClients: { [key: string]: DbClient }
export const getDbClients = async () => {
  if (dbClients) return dbClients
  const maxConnections = parseInt(
    process.env['POSTGRES_MAX_CONNECTIONS_FILE_IMPORT_SERVICE'] || '1'
  )
  const connectionAcquireTimeoutMillis = parseInt(
    process.env['POSTGRES_CONNECTION_ACQUIRE_TIMEOUT_MILLIS'] || '16000'
  )
  const connectionCreateTimeoutMillis = parseInt(
    process.env['POSTGRES_CONNECTION_CREATE_TIMEOUT_MILLIS'] || '5000'
  )

  const configArgs = {
    migrationDirs: [],
    isTestEnv: isDevEnv,
    isDevOrTestEnv: isDevEnv,
    logger,
    maxConnections,
    applicationName: 'speckle_fileimport_service',
    connectionAcquireTimeoutMillis,
    connectionCreateTimeoutMillis
  }
  if (!FF_WORKSPACES_MULTI_REGION_ENABLED) {
    const mainClient = configureKnexClient(
      {
        postgres: {
          connectionUri:
            process.env.PG_CONNECTION_STRING ||
            'postgres://speckle:speckle@127.0.0.1/speckle'
        }
      },
      configArgs
    )
    dbClients = { main: mainClient }
  } else {
    const configPath = process.env.MULTI_REGION_CONFIG_PATH || 'multiregion.json'
    const config = await loadMultiRegionsConfig({ path: configPath })

    const clients: [string, DbClient][] = [
      ['main', configureKnexClient(config.main, configArgs)]
    ]
    Object.entries(config.regions).map(([key, config]) => {
      clients.push([key, configureKnexClient(config, configArgs)])
    })
    dbClients = Object.fromEntries(clients)
  }
  return dbClients
}
