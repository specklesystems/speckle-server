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
import { getGenericRedis } from '@/modules/shared/redis/redis'
import knex, { Knex } from 'knex'
import { getRegionFactory, getRegionsFactory } from '@/modules/multiregion/repositories'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { createKnexConfig } from '@/knexfile'
import { InitializeRegion } from '@/modules/multiregion/domain/operations'
import {
  getAvailableRegionConfig,
  getMainRegionConfig
} from '@/modules/multiregion/regionConfig'
import { RegionServerConfig } from '@/modules/multiregion/domain/types'
import { MaybeNullOrUndefined } from '@speckle/shared'

let getter: GetProjectDb | undefined = undefined

export const getRegionDb: GetRegionDb = async ({ regionKey }) => {
  const getRegion = getRegionFactory({ db })
  const regionClients = await getRegisteredRegionClients()
  if (!(regionKey in regionClients)) {
    const region = await getRegion({ key: regionKey })
    if (!region) throw new Error('Invalid region key')

    // the region was initialized in a different server instance
    const regionConfigs = await getAvailableRegionConfig()
    if (!(regionKey in regionConfigs))
      throw new Error(`RegionKey ${regionKey} not available in config`)

    const newRegionConfig = regionConfigs[regionKey]
    const regionDb = configureKnexClient(newRegionConfig).public
    regionClients[regionKey] = regionDb
  }

  return regionClients[regionKey]
}

export const getDb = async ({
  regionKey
}: {
  regionKey: MaybeNullOrUndefined<string>
}): Promise<Knex> => (regionKey ? getRegionDb({ regionKey }) : db)

const initializeDbGetter = async (): Promise<GetProjectDb> => {
  const getDefaultDb = () => db

  // if multi region is not enabled, lets fall back to the main Db ALWAYS
  if (!isMultiRegionEnabled()) return async () => getDefaultDb()

  const { getRegionKey, writeRegion } = inMemoryRegionKeyStoreFactory()

  const redis = getGenericRedis()

  const getProjectRegionKey = getProjectRegionKeyFactory({
    getRegionKeyFromMemory: getRegionKey,
    writeRegionToMemory: writeRegion,
    getRegionKeyFromCache: getRegionKeyFromCacheFactory({ redis }),
    writeRegionKeyToCache: writeRegionKeyToCacheFactory({ redis }),
    getRegionKeyFromStorage: getRegionKeyFromStorageFactory({ db })
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
      return [region.key, configureKnexClient(regionConfigs[region.key]).public]
    })
  )
}

const configureKnexClient = (
  config: RegionServerConfig
): { public: Knex; private?: Knex } => {
  const knexConfig = createKnexConfig({
    connectionString: config.postgres.connectionUri,
    caCertificate: config.postgres.publicTlsCertificate
  })
  const privateConfig = config.postgres.privateConnectionUri
    ? knex(
        createKnexConfig({
          connectionString: config.postgres.privateConnectionUri,
          caCertificate: config.postgres.publicTlsCertificate
        })
      )
    : undefined
  return { public: knex(knexConfig), private: privateConfig }
}

export const getRegisteredRegionClients = async (): Promise<RegionClients> => {
  if (!registeredRegionClients)
    registeredRegionClients = await initializeRegisteredRegionClients()
  return registeredRegionClients
}

export const getRegisteredDbClients = async (): Promise<Knex[]> =>
  Object.values(await getRegisteredRegionClients())

export const initializeRegion: InitializeRegion = async ({ regionKey }) => {
  const knownClients = await getRegisteredRegionClients()
  if (regionKey in knownClients)
    throw new Error(`Region ${regionKey} is already initialized`)

  const regionConfigs = await getAvailableRegionConfig()
  if (!(regionKey in regionConfigs))
    throw new Error(`RegionKey ${regionKey} not available in config`)

  const newRegionConfig = regionConfigs[regionKey]
  const regionDb = configureKnexClient(newRegionConfig)
  await regionDb.public.migrate.latest()
  // TODO, set up pub-sub shit

  const mainDbConfig = await getMainRegionConfig()
  const mainDb = configureKnexClient(mainDbConfig)

  const sslmode = newRegionConfig.postgres.publicTlsCertificate ? 'require' : 'disable'

  await setUpUserReplication({
    from: mainDb,
    to: regionDb,
    regionName: regionKey,
    sslmode
  })

  await setUpProjectReplication({
    from: regionDb,
    to: mainDb,
    regionName: regionKey,
    sslmode
  })
  // pushing to the singleton object here
  knownClients[regionKey] = regionDb.public
}

interface ReplicationArgs {
  from: { public: Knex; private?: Knex }
  to: { public: Knex; private?: Knex }
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
    await from.public.raw('CREATE PUBLICATION userspub FOR TABLE users;')
  } catch (err) {
    if (!(err instanceof Error)) throw err
    if (!err.message.includes('already exists')) throw err
  }

  const fromUrl = new URL(
    from.private
      ? from.private.client.config.connection.connectionString
      : from.public.client.config.connection.connectionString
  )
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
    await to.public.raw('CREATE EXTENSION IF NOT EXISTS "aiven_extras"')
    await to.public.raw(rawSqeel)
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
    await from.public.raw('CREATE PUBLICATION projectpub FOR TABLE streams;')
  } catch (err) {
    if (!(err instanceof Error)) throw err
    if (!err.message.includes('already exists')) throw err
  }

  const fromUrl = new URL(
    from.private
      ? from.private.client.config.connection.connectionString
      : from.public.client.config.connection.connectionString
  )
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
    await to.public.raw('CREATE EXTENSION IF NOT EXISTS "aiven_extras"')
    await to.public.raw(rawSqeel)
  } catch (err) {
    if (!(err instanceof Error)) throw err
    if (!err.message.includes('already exists')) throw err
  }
}
