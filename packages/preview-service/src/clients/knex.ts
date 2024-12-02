import { knexLogger as logger } from '@/observability/logging.js'
import { getPostgresConnectionString, getPostgresMaxConnections } from '@/utils/env.js'
import Environment from '@speckle/shared/dist/commonjs/environment/index.js'
import {
  loadMultiRegionsConfig,
  configureKnexClient
} from '@speckle/shared/dist/commonjs/environment/multiRegionConfig.js'
import { Knex } from 'knex'

const { FF_WORKSPACES_MULTI_REGION_ENABLED } = Environment.getFeatureFlags()

type ConfiguredKnexClient = ReturnType<typeof configureKnexClient>
export type DbClients = Record<'main', ConfiguredKnexClient> &
  Record<string, ConfiguredKnexClient>
let dbClients: DbClients

const isDevEnv = process.env.NODE_ENV === 'development'

export const getDbClients = async () => {
  if (dbClients) return dbClients
  const maxConnections = getPostgresMaxConnections()

  const configArgs = {
    migrationDirs: [],
    isTestEnv: isDevEnv,
    isDevOrTestEnv: isDevEnv,
    logger,
    maxConnections,
    applicationName: 'speckle_fileimport_service'
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

export const getProjectDbClient = async ({
  projectId
}: {
  projectId: string
}): Promise<Knex> => {
  const dbClients = await getDbClients()
  const mainDb = dbClients.main.public
  if (!FF_WORKSPACES_MULTI_REGION_ENABLED) return mainDb

  const projectRegion = await mainDb<{ id: string; regionKey: string | null }>(
    'streams'
  )
    .select('id', 'regionKey')
    .where({ id: projectId })
    .first()

  if (!projectRegion?.regionKey) return mainDb

  const regionDb = dbClients[projectRegion.regionKey]
  if (!regionDb)
    throw new Error(`Project region client not found for ${projectRegion.regionKey}`)

  return regionDb.public
}
