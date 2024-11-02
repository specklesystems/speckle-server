import { db } from '@/db/knex'
import { isMultiRegionEnabled } from '@/modules/multiregion/helpers'
import {
  getRegionKeyFromCacheFactory,
  getRegionKeyFromStorageFactory,
  inMemoryRegionKeyStoreFactory,
  writeRegionKeyToCacheFactory
} from '@/modules/multiregion/repositories/projectRegion'
import {
  GetProjectDb,
  getProjectDbClientFactory,
  getProjectRegionKeyFactory,
  GetRegionDb
} from '@/modules/multiregion/services/projectRegion'
import { getGenericRedis } from '@/modules/core'
import knex, { Knex } from 'knex'
import { getRegionsFactory } from '@/modules/multiregion/repositories'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { createKnexConfig } from '@/knexfile'
import { InitializeRegion } from '@/modules/multiregion/domain/operations'
import { getAvailableRegionConfig } from '@/modules/multiregion/regionConfig'
import { RegionServerConfig } from '@/modules/multiregion/domain/types'

let getter: GetProjectDb | undefined = undefined

const initializeDbGetter = async (): Promise<GetProjectDb> => {
  const getDefaultDb = () => db

  // if multi region is not enabled, lets fall back to the main Db ALWAYS
  if (!isMultiRegionEnabled()) return async () => getDefaultDb()

  const regionClients = await getRegisteredRegionClients()
  const getRegionDb: GetRegionDb = ({ regionKey }) => {
    if (!(regionKey in regionClients)) throw new Error('Invalid region key')
    return regionClients[regionKey]
  }

  const { getRegionKey, writeRegion } = inMemoryRegionKeyStoreFactory()

  const redis = getGenericRedis()

  const getProjectRegionKey = getProjectRegionKeyFactory({
    getRegionKeyFromMemory: getRegionKey,
    writeRegionToMemory: writeRegion,
    getRegionKeyFromCache: getRegionKeyFromCacheFactory({ redis }),
    writeRegionKeyToCache: writeRegionKeyToCacheFactory({ redis }),
    getRegionKeyFromStorage: getRegionKeyFromStorageFactory({ db: getDefaultDb() })
  })

  return getProjectDbClientFactory({
    getDefaultDb,
    getRegionDb,
    getProjectRegionKey
  })
}

// this guy is the star of the show here
export const getProjectDbClient: GetProjectDb = async ({ projectId }) => {
  if (!getter) getter = await initializeDbGetter()
  return await getter({ projectId })
}

type RegionClients = Record<string, Knex>
let registeredRegionClients: RegionClients | undefined = undefined

const initializeRegisteredRegionClients = async (): Promise<RegionClients> => {
  const configuredRegions = await getRegionsFactory({ db })()
  const regionConfigs = await getAvailableRegionConfig()

  return Object.fromEntries(
    configuredRegions.map((region) => {
      if (!(region.key in regionConfigs))
        throw new MisconfiguredEnvironmentError(
          `Missing region config for ${region.key} region`
        )
      return [region.key, configureKnexClient(regionConfigs[region.key])]
    })
  )
}

const configureKnexClient = (config: RegionServerConfig): Knex => {
  const knexConfig = createKnexConfig({
    connectionString: config.postgres.connectionUri,
    caCertificate: config.postgres.publicTlsCertificate
  })
  return knex(knexConfig)
}

export const getRegisteredRegionClients = async (): Promise<RegionClients> => {
  if (!registeredRegionClients)
    registeredRegionClients = await initializeRegisteredRegionClients()
  return registeredRegionClients
}

export const initializeRegion: InitializeRegion = async ({ regionKey }) => {
  const knownClients = await getRegisteredRegionClients()
  if (regionKey in knownClients)
    throw new Error(`Region ${regionKey} is already initialized`)
  const regionConfigs = await getAvailableRegionConfig()
  if (!(regionKey in regionConfigs))
    throw new Error(`RegionKey ${regionKey} not available in config`)

  const newRegionConfig = regionConfigs[regionKey]
  const regionDb = configureKnexClient(newRegionConfig)
  await regionDb.migrate.latest()
  // TODO, set up pub-sub shit
  const sslmode = newRegionConfig.postgres.publicTlsCertificate ? 'require' : 'disable'

  await setUpUserReplication({
    from: db,
    to: regionDb,
    regionName: regionKey,
    sslmode
  })

  await setUpProjectReplication({
    from: regionDb,
    to: db,
    regionName: regionKey,
    sslmode
  })
  // pushing to the singleton object here
  knownClients[regionKey] = regionDb
}

interface ReplicationArgs {
  from: Knex
  to: Knex
  sslmode: string
  regionName: string
}

const setUpUserReplication = async ({
  from,
  to,
  sslmode,
  regionName
}: ReplicationArgs): Promise<void> => {
  // TODO: ensure its created...
  try {
    await from.raw('CREATE PUBLICATION userspub FOR TABLE users;')
  } catch (err) {
    if (!(err instanceof Error)) throw err
    if (!err.message.includes('already exists')) throw err
  }

  const fromUrl = new URL(from.client.config.connection.connectionString)
  const port = fromUrl.port ? fromUrl.port : '5432'
  const fromDbName = fromUrl.pathname.replace('/', '')
  const subName = `userssub_${regionName}`
  const rawSqeel = `SELECT * FROM aiven_extras.pg_create_subscription(
    '${subName}',
    'dbname=${fromDbName} host=${fromUrl.hostname} port=${port} sslmode=${sslmode} user=${fromUrl.username} password=${fromUrl.password}',
    'userspub', 
    '${subName}',
    TRUE,
    TRUE
  );`
  try {
    await to.raw(rawSqeel)
  } catch (err) {
    if (!(err instanceof Error)) throw err
    if (!err.message.includes('already exists')) throw err
  }
}

const setUpProjectReplication = async ({
  from,
  to,
  regionName,
  sslmode
}: ReplicationArgs): Promise<void> => {
  // TODO: ensure its created...
  try {
    await from.raw('CREATE PUBLICATION projectpub FOR TABLE streams;')
  } catch (err) {
    if (!(err instanceof Error)) throw err
    if (!err.message.includes('already exists')) throw err
  }

  const fromUrl = new URL(from.client.config.connection.connectionString)
  const port = fromUrl.port ? fromUrl.port : '5432'
  const fromDbName = fromUrl.pathname.replace('/', '')
  const subName = `projectsub_${regionName}`
  const rawSqeel = `SELECT * FROM aiven_extras.pg_create_subscription(
    '${subName}',
    'dbname=${fromDbName} host=${fromUrl.hostname} port=${port} sslmode=${sslmode} user=${fromUrl.username} password=${fromUrl.password}',
    'projectpub', 
    '${subName}',
    TRUE,
    TRUE
  );`
  try {
    await to.raw(rawSqeel)
  } catch (err) {
    if (!(err instanceof Error)) throw err
    if (!err.message.includes('already exists')) throw err
  }
}
