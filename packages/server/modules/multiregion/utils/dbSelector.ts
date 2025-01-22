import { db } from '@/db/knex'
import {
  GetProjectDb,
  getProjectDbClientFactory,
  GetRegionDb
} from '@/modules/multiregion/services/projectRegion'
import { Knex } from 'knex'
import { getRegionFactory } from '@/modules/multiregion/repositories'
import { DatabaseError, MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { configureClient } from '@/knexfile'
import { InitializeRegion } from '@/modules/multiregion/domain/operations'
import {
  getAvailableRegionConfig,
  getDefaultProjectRegionKey,
  getMainRegionConfig
} from '@/modules/multiregion/regionConfig'
import { ensureError, MaybeNullOrUndefined } from '@speckle/shared'
import { isDevOrTestEnv, isTestEnv } from '@/modules/shared/helpers/envHelper'
import { migrateDbToLatest } from '@/db/migrations'
import {
  getProjectRegionKey,
  getRegisteredRegionConfigs
} from '@/modules/multiregion/utils/regionSelector'
import { mapValues } from 'lodash'
import { isMultiRegionEnabled } from '@/modules/multiregion/helpers'

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

// the default region key is a config value, we're caching this globally
let defaultRegionKeyCache: string | null | undefined = undefined

export const getValidDefaultProjectRegionKey = async (): Promise<string | null> => {
  if (defaultRegionKeyCache !== undefined) return defaultRegionKeyCache
  const defaultRegionKey = await getDefaultProjectRegionKey()

  if (!defaultRegionKey) return defaultRegionKey
  const registeredRegionClients = await getRegisteredRegionClients()
  if (!(defaultRegionKey in registeredRegionClients))
    throw new MisconfiguredEnvironmentError(
      `There is no region client registered for the default region key ${defaultRegionKey} `
    )

  defaultRegionKeyCache = defaultRegionKey
  return defaultRegionKey
}

type RegionClients = Record<string, Knex>
let registeredRegionClients: RegionClients | undefined = undefined

/**
 * Idempotently initialize registered region (in db) Knex clients
 */
export const initializeRegisteredRegionClients = async (): Promise<RegionClients> => {
  // init knex clients
  const configs = await getRegisteredRegionConfigs()
  const ret = mapValues(configs, (config) => configureClient(config).public)

  // run migrations
  await Promise.all(
    Object.entries(ret).map(([region, db]) => migrateDbToLatest({ db, region }))
  )

  // (re-)set up pub-sub, if needed
  // (disabled in prod cause there's too many DBs and connections and the load is too hard to handle)
  if (isDevOrTestEnv()) {
    await Promise.all(
      Object.keys(ret).map((regionKey) => initializeRegion({ regionKey }))
    )
  }

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
  const regionDbs: RegionClients = isMultiRegionEnabled()
    ? await getRegisteredRegionClients()
    : {}
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
 * Idempotently initialize region db
 */
export const initializeRegion: InitializeRegion = async ({ regionKey }) => {
  const regionConfigs = await getAvailableRegionConfig()
  if (!(regionKey in regionConfigs))
    throw new Error(`RegionKey ${regionKey} not available in config`)

  const newRegionConfig = regionConfigs[regionKey]
  const regionDb = configureClient(newRegionConfig)
  await migrateDbToLatest({ db: regionDb.public, region: regionKey })

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

  // pushing to the singleton object here, only if its not available
  // if this is being triggered from init, its gonna be set after anyway
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
    if (!(err instanceof Error))
      throw new DatabaseError(
        'Could not create publication {pubName} when setting up user replication for region {regionName}',
        from.public,
        {
          cause: ensureError(err, 'Unknown database error when creating publication'),
          info: { pubName, regionName }
        }
      )
    if (
      !['already exists', 'violates unique constraint'].some((message) =>
        err.message.includes(message)
      )
    )
      throw err
  }

  const fromUrl = new URL(
    from.private
      ? from.private.client.config.connection.connectionString
      : from.public.client.config.connection.connectionString
  )
  const port = fromUrl.port ? fromUrl.port : '5432'
  const fromDbName = fromUrl.pathname.replace('/', '')
  const rawSqeel = `SELECT * FROM aiven_extras.pg_create_subscription(
    ?,
    ?,
    ?,
    ?,
    TRUE,
    TRUE
  );`
  try {
    await to.public.raw('CREATE EXTENSION IF NOT EXISTS "aiven_extras"')
    await to.public.raw(rawSqeel, [
      subName,
      `dbname=${fromDbName} host=${fromUrl.hostname} port=${port} sslmode=${sslmode} user=${fromUrl.username} password=${fromUrl.password}`,
      pubName,
      subName
    ])
  } catch (err) {
    if (!(err instanceof Error))
      throw new DatabaseError(
        'Could not create subscription {subName} to {pubName} when setting up user replication for region {regionName}',
        to.public,
        {
          cause: ensureError(err, 'Unknown database error when creating subscription'),
          info: { subName, pubName, regionName }
        }
      )
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
    if (!(err instanceof Error))
      throw new DatabaseError(
        'Could not create publication {pubName} when setting up project replication for region {regionName}',
        from.public,
        {
          cause: ensureError(err, 'Unknown database error when creating publication'),
          info: { pubName, regionName }
        }
      )
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
    ?,
    ?,
    ?,
    ?,
    TRUE,
    TRUE
  );`
  try {
    await to.public.raw('CREATE EXTENSION IF NOT EXISTS "aiven_extras"')
    await to.public.raw(rawSqeel, [
      subName,
      `dbname=${fromDbName} host=${fromUrl.hostname} port=${port} sslmode=${sslmode} user=${fromUrl.username} password=${fromUrl.password}`,
      pubName,
      subName
    ])
  } catch (err) {
    if (!(err instanceof Error))
      throw new DatabaseError(
        'Could not create subscription {subName} to {pubName} when setting up project replication for region {regionName}',
        to.public,
        {
          cause: ensureError(err, 'Unknown database error when creating subscription'),
          info: { subName, pubName, regionName }
        }
      )
    if (!err.message.includes('already exists')) throw err
  }
}
