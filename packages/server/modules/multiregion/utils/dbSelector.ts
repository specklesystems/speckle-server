import { db } from '@/db/knex'
import type {
  GetProjectDb,
  GetRegionDb
} from '@/modules/multiregion/services/projectRegion'
import { getProjectDbClientFactory } from '@/modules/multiregion/services/projectRegion'
import type { Knex } from 'knex'
import { getRegionFactory } from '@/modules/multiregion/repositories'
import {
  DatabaseError,
  LogicError,
  MisconfiguredEnvironmentError,
  TestOnlyLogicError
} from '@/modules/shared/errors'
import { configureClient } from '@/knexfile'
import type { InitializeRegion } from '@/modules/multiregion/domain/operations'
import {
  getAvailableRegionConfig,
  getDefaultProjectRegionKey,
  getMainRegionConfig
} from '@/modules/multiregion/regionConfig'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { ensureError, TIME_MS, wait } from '@speckle/shared'
import { isTestEnv } from '@/modules/shared/helpers/envHelper'
import { migrateDbToLatest } from '@/db/migrations'
import {
  getProjectRegionKey,
  getRegisteredRegionConfigs
} from '@/modules/multiregion/utils/regionSelector'
import { get, mapValues } from 'lodash-es'
import { isMultiRegionEnabled } from '@/modules/multiregion/helpers'
import { logger } from '@/observability/logging'

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
    if (!region) throw new LogicError('Invalid region key')

    // the region was initialized in a different server instance
    const regionConfigs = await getAvailableRegionConfig()
    if (!(regionKey in regionConfigs))
      throw new MisconfiguredEnvironmentError(
        `RegionKey ${regionKey} not available in config`
      )

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

  // initialize regions
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

export const getAllRegisteredDbs = async (): Promise<[Knex, ...Knex[]]> => {
  const mainDb = db
  const regionDbs: RegionClients = isMultiRegionEnabled()
    ? await getRegisteredRegionClients()
    : {}

  return [mainDb, ...Object.entries(regionDbs).map(([, client]) => client)]
}

/**
 * Idempotently initialize region db
 */
export const initializeRegion: InitializeRegion = async ({ regionKey }) => {
  const regionConfigs = await getAvailableRegionConfig()
  if (!(regionKey in regionConfigs))
    throw new MisconfiguredEnvironmentError(
      `RegionKey ${regionKey} not available in config`
    )

  const newRegionConfig = regionConfigs[regionKey]
  const newRegionDbConfig = newRegionConfig.postgres

  const regionDb = configureClient(newRegionConfig)

  if (!newRegionDbConfig.skipInitialization) {
    await migrateDbToLatest({ db: regionDb.public, region: regionKey })

    const mainDbConfig = await getMainRegionConfig()
    const mainDb = configureClient(mainDbConfig)

    const sslmode = newRegionConfig.postgres.publicTlsCertificate
      ? 'require'
      : 'disable'

    await dropUserReplicationIfExists({
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
  }

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

const dropUserReplicationIfExists = async ({
  from,
  to,
  regionName
}: ReplicationArgs): Promise<void> => {
  const subName = createPubSubName(`userssub_${regionName}`)
  const pubName = createPubSubName('userspub')

  try {
    const { rows: pubExist } = await from.public.raw(
      `SELECT pubname FROM pg_publication WHERE pubname = '${pubName}';`
    )

    if (pubExist.length > 0) {
      await from.public.raw(`DROP PUBLICATION ${pubName};`)
      logger.info({ regionName, pubName }, 'dropped publication')
    }
  } catch (error) {
    logger.warn({ error }, 'while dropping publication')
    // silent error as
    // dropping pub can have race conditions (n subs - 1 pub)
    // and action DROP PUBLICATION does not support if exist for current postgres version
  }

  try {
    const { rows: aivenExists } = await to.public.raw(
      "SELECT * FROM pg_extension WHERE extname = 'aiven_extras';"
    )

    if (!aivenExists) return

    const {
      rows: [sub]
    } = await to.public.raw<{ rows: { subconninfo: string; subslotname: string }[] }>(
      `SELECT subconninfo, subslotname FROM aiven_extras.pg_list_all_subscriptions() WHERE subname = '${subName}';`
    )

    if (!sub) return

    await to.public.raw(
      `SELECT * FROM aiven_extras.pg_alter_subscription_disable('${subName}');`
    )
    await wait(TIME_MS.second)
    await to.public.raw(
      `SELECT * FROM aiven_extras.pg_drop_subscription('${subName}');`
    )
    await wait(TIME_MS.second)
    await to.public.raw(
      `SELECT * FROM aiven_extras.dblink_slot_create_or_drop('${sub.subconninfo}', '${sub.subslotname}', 'drop');`
    )
    logger.info({ regionName, subName }, 'dropped subscription')
  } catch (error) {
    logger.error({ error }, 'Failed to drop subscription')
    return
  }

  return
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
          cause: ensureError(
            sanitizeError(err),
            'Unknown database error when creating publication'
          ),
          info: { pubName, regionName }
        }
      )
    if (
      !err.message.includes('already exists') &&
      !err.message.includes('duplicate key value violates unique constraint')
    )
      throw new DatabaseError(
        'Unknown error while creating publication {pubName} when setting up project replication for region {regionName}',
        from.public,
        {
          cause: ensureError(
            sanitizeError(err),
            'Unknown database error when creating publication'
          ),
          info: { pubName, regionName }
        }
      )
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
          cause: ensureError(
            sanitizeError(err),
            'Unknown database error when creating subscription'
          ),
          info: { subName, pubName, regionName }
        }
      )
    if (
      !err.message.includes('already exists') &&
      !err.message.includes('duplicate key value violates unique constraint')
    )
      throw new DatabaseError(
        'Unknown error while creating subscription {subName} to {pubName} when setting up project replication for region {regionName}',
        to.public,
        {
          cause: ensureError(
            sanitizeError(err),
            'Unknown database error when creating subscription'
          ),
          info: { subName, pubName, regionName }
        }
      )
  }
}

const sanitizeError = (err: unknown): unknown => {
  if (!err) return err
  if ((get(err, 'where') as unknown as string).includes('password='))
    return { ...err, where: '[REDACTED AS IT CONTAINS CONNECTION STRING]' }
}

export const resetRegisteredRegions = () => {
  if (!isTestEnv()) {
    throw new TestOnlyLogicError()
  }

  registeredRegionClients = undefined
}
