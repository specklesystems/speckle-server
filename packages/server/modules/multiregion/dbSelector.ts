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
import { Knex } from 'knex'
import { getRegionFactory, getRegionsFactory } from '@/modules/multiregion/repositories'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { configureClient } from '@/knexfile'
import { InitializeRegion } from '@/modules/multiregion/domain/operations'
import {
  getAvailableRegionConfig,
  getMainRegionConfig
} from '@/modules/multiregion/regionConfig'
import { MaybeNullOrUndefined } from '@speckle/shared'
import { isTestEnv } from '@/modules/shared/helpers/envHelper'

let getter: GetProjectDb | undefined = undefined

/**
 * All dbs share the list of pubs/subs, so we need to make sure the test db uses their own.
 * As long as there's only 1 test db per instance, it should be fine
 */
const createPubSubName = (name: string): string => (isTestEnv() ? `test_${name}` : name)

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
    const regionDb = configureClient(newRegionConfig).public
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

/**
 * Idempotently initialize registered region (in db) Knex clients
 */
export const initializeRegisteredRegionClients = async (): Promise<RegionClients> => {
  const configuredRegions = await getRegionsFactory({ db })()
  if (!configuredRegions.length) return {}

  // init knex clients
  const regionConfigs = await getAvailableRegionConfig()
  const ret = Object.fromEntries(
    configuredRegions.map((region) => {
      if (!(region.key in regionConfigs))
        throw new MisconfiguredEnvironmentError(
          `Missing region config for ${region.key} region`
        )
      return [region.key, configureClient(regionConfigs[region.key]).public]
    })
  )

  // run migrations
  await Promise.all(Object.values(ret).map((db) => db.migrate.latest()))

  // (re-)set up pub-sub, if needed
  await Promise.all(
    Object.keys(ret).map((regionKey) => initializeRegion({ regionKey }))
  )

  registeredRegionClients = ret
  return ret
}

export const getRegisteredRegionClients = async (): Promise<RegionClients> => {
  if (!registeredRegionClients)
    registeredRegionClients = await initializeRegisteredRegionClients()
  return registeredRegionClients
}

export const getRegisteredDbClients = async (): Promise<Knex[]> =>
  Object.values(await getRegisteredRegionClients())

export const getAllRegisteredDbClients = async (): Promise<
  Array<{ client: Knex; isMain: boolean; regionKey: string }>
> => {
  const mainDb = db
  const regionDbs = await getRegisteredRegionClients()
  return [
    {
      client: mainDb,
      isMain: true,
      regionKey: 'main'
    },
    ...Object.entries(regionDbs).map(([regionKey, client]) => ({
      client,
      isMain: false,
      regionKey
    }))
  ]
}

/**
 * Idempotently initialize region
 */
export const initializeRegion: InitializeRegion = async ({ regionKey }) => {
  const regionConfigs = await getAvailableRegionConfig()
  if (!(regionKey in regionConfigs))
    throw new Error(`RegionKey ${regionKey} not available in config`)

  const newRegionConfig = regionConfigs[regionKey]
  const regionDb = configureClient(newRegionConfig)
  await regionDb.public.migrate.latest()

  const mainDbConfig = await getMainRegionConfig()
  const mainDb = configureClient(mainDbConfig)

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

  // pushing to the singleton object here, its only not available
  // if this is being triggered from init, and in that case its gonna be set after anyway
  if (registeredRegionClients) {
    registeredRegionClients[regionKey] = regionDb.public
  }
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
  const subName = createPubSubName(`userssub_${regionName}`)
  const pubName = createPubSubName('userspub')

  try {
    await from.public.raw(`CREATE PUBLICATION ${pubName} FOR TABLE users;`)
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
  const rawSqeel = `SELECT * FROM aiven_extras.pg_create_subscription(
    '${subName}',
    'dbname=${fromDbName} host=${fromUrl.hostname} port=${port} sslmode=${sslmode} user=${fromUrl.username} password=${fromUrl.password}',
    '${pubName}', 
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
  const subName = createPubSubName(`projectsub_${regionName}`)
  const pubName = createPubSubName('projectpub')

  try {
    await from.public.raw(`CREATE PUBLICATION ${pubName} FOR TABLE streams;`)
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
  const rawSqeel = `SELECT * FROM aiven_extras.pg_create_subscription(
    '${subName}',
    'dbname=${fromDbName} host=${fromUrl.hostname} port=${port} sslmode=${sslmode} user=${fromUrl.username} password=${fromUrl.password}',
    '${pubName}', 
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
