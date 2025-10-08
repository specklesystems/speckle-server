import { z } from 'zod'
import fs from 'node:fs/promises'
import * as Knex from 'knex' // knex has broken types, hence the * as import
import { Logger } from 'pino'
import { isUndefined, get } from '#lodash'

// cause of knex's ESM/CJS interop issues
const knex = get(Knex, 'knex') || get(Knex, 'default')

export const regionConfigSchema = z.object({
  postgres: z.object({
    connectionUri: z
      .string()
      .describe(
        'Full Postgres connection URI (e.g. "postgres://user:password@host:port/dbname")'
      ),
    databaseName: z
      .string()
      .describe(
        'Name of the database to connect to. Used where the connection string is to a connection pool, and does not include the database name.'
      )
      .optional(),
    privateConnectionUri: z
      .string()
      .describe(
        'Full Postgres connection URI in VPN or Docker networks (e.g. "postgres://user:password@host:port/dbname")'
      )
      .optional(),
    publicTlsCertificate: z
      .string()
      .describe('Public TLS ("CA") certificate for the Postgres server')
      .optional(),
    skipInitialization: z
      .boolean()
      .optional()
      .describe(
        'Skip database initialization (migration run & replication setup). Only used in tests.'
      )
      .refine((val) => val !== true || process.env.NODE_ENV === 'test', {
        message: 'skipInitialization can only be set when NODE_ENV is "test"'
      })
  }),
  blobStorage: z.object({
    endpoint: z
      .string()
      .url()
      .describe(
        'URL of the S3-compatible storage endpoint, accessible from the server'
      ),
    publicEndpoint: z
      .string()
      .url()
      .optional()
      .describe(
        'Public URL of the S3-compatible storage endpoint, accessible from clients via the public internet'
      ),
    accessKey: z.string().describe('Access key for the S3-compatible storage endpoint'),
    secretKey: z.string().describe('Secret key for the S3-compatible storage endpoint'),
    bucket: z.string().describe('Name of the S3-compatible storage bucket'),
    createBucketIfNotExists: z
      .boolean()
      .describe('Whether to create the bucket if it does not exist'),
    s3Region: z.string().describe('Region of the S3-compatible storage endpoint')
  })
})

const multiRegionConfigSchema = z.object({
  main: regionConfigSchema,
  regions: z.record(z.string(), regionConfigSchema),
  defaultProjectRegionKey: z.string().min(3).nullish()
})

export type MultiRegionConfig = z.infer<typeof multiRegionConfigSchema>
export type MainRegionConfig = MultiRegionConfig['main']
export type DataRegionsConfig = MultiRegionConfig['regions']
export type RegionServerConfig = z.infer<typeof regionConfigSchema>
export type BlobStorageConfig = RegionServerConfig['blobStorage']

export const loadMultiRegionsConfig = async ({
  path
}: {
  path: string
}): Promise<MultiRegionConfig> => {
  let file: string
  try {
    file = await fs.readFile(path, 'utf-8')
  } catch (e) {
    if (e instanceof Error && 'code' in e && e.code === 'ENOENT') {
      throw new Error(`Multi-region config file not found at path: ${path}`)
    }
    throw e
  }

  let parsedJson: Record<string, unknown>
  try {
    parsedJson = JSON.parse(file) as Record<string, unknown> // This will throw if the file is not valid JSON
  } catch {
    throw new Error(`Multi-region config file at path '${path}' is not valid JSON`)
  }

  const schema = multiRegionConfigSchema
  const multiRegionConfigFileResult = schema.safeParse(parsedJson) // This will throw if the config is invalid
  if (!multiRegionConfigFileResult.success)
    throw new Error(
      `Multi-region config file at path '${path}' does not fit the schema: ${multiRegionConfigFileResult.error}`
    )

  return multiRegionConfigFileResult.data
}

export type KnexConfigArgs = {
  migrationDirs: string[]
  /**
   * Override migration source loader to load migrations a custom way
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  migrationSource?: any // no type from knex for this
  isTestEnv?: boolean
  isDevOrTestEnv?: boolean
  isDevEnv?: boolean
  logger: Logger
  maxConnections: number
  applicationName: string
  connectionAcquireTimeoutMillis: number
  connectionCreateTimeoutMillis: number
  /**
   * If set to any value - true or false - will explicitly enable or disable async stack traces
   * that show where queries are launched from. If not set, will default to true in dev
   * and test environments
   */
  asyncStackTraces?: boolean
}

export const createKnexConfig = ({
  connectionString,
  migrationDirs,
  isTestEnv,
  isDevOrTestEnv,
  logger,
  maxConnections,
  caCertificate,
  connectionAcquireTimeoutMillis,
  connectionCreateTimeoutMillis,
  asyncStackTraces,
  migrationSource
}: {
  connectionString?: string | undefined
  caCertificate?: string | undefined
} & KnexConfigArgs): Knex.Knex.Config => {
  const shouldEnableAsyncStackTraces = isUndefined(asyncStackTraces)
    ? isDevOrTestEnv
    : asyncStackTraces

  return {
    client: 'pg',
    migrations: {
      extension: 'ts',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      migrationSource,
      // these warnings are annoying locally when switching branches:
      disableMigrationsListValidation: !!isDevOrTestEnv,
      ...(migrationSource
        ? {}
        : {
            // Can only be set if migrationSource is not set
            loadExtensions: isTestEnv ? ['.js', '.ts'] : ['.js'],
            directory: migrationDirs
          })
    },
    log: {
      warn(message: unknown) {
        logger.warn(message)
      },
      error(message: unknown) {
        logger.error(message)
      },
      deprecate(message: unknown) {
        logger.info(message)
      },
      debug(message: unknown) {
        logger.debug(message)
      }
    },
    connection: {
      connectionString,
      ssl: caCertificate ? { ca: caCertificate, rejectUnauthorized: true } : undefined,
      // eslint-disable-next-line camelcase
      application_name: 'speckle_server'
    },
    // we wish to avoid leaking sql queries in the logs: https://knexjs.org/guide/#compilesqlonerror
    compileSqlOnError: isDevOrTestEnv,
    asyncStackTraces: shouldEnableAsyncStackTraces,
    pool: {
      min: 0,
      max: maxConnections,
      acquireTimeoutMillis: connectionAcquireTimeoutMillis, // If the maximum number of connections is reached, it wait for 16 seconds trying to acquire an existing connection before throwing a timeout error.
      createTimeoutMillis: connectionCreateTimeoutMillis // If no existing connection is available and the maximum number of connections is not yet reached, the pool will try to create a new connection for 5 seconds before throwing a timeout error.
      // createRetryIntervalMillis: 200, // Irrelevant & ignored because propagateCreateError is true.
      // propagateCreateError: true // The propagateCreateError is set to true by default in Knex and throws a TimeoutError if the first create connection to the database fails. Knex recommends that this value is NOT set to false, despite what 'helpful' people on Stackoverflow tell you: https://github.com/knex/knex/issues/3455#issuecomment-535554401
    }
  }
}

export const configureKnexClient = (
  config: Pick<RegionServerConfig, 'postgres'>,
  configArgs: KnexConfigArgs
): { public: Knex.Knex; private?: Knex.Knex } => {
  const knexConfig = createKnexConfig({
    connectionString: config.postgres.connectionUri,
    caCertificate: config.postgres.publicTlsCertificate,
    ...configArgs
  })
  const privateConfig = config.postgres.privateConnectionUri
    ? knex(
        createKnexConfig({
          connectionString: config.postgres.privateConnectionUri,
          caCertificate: config.postgres.publicTlsCertificate,
          ...configArgs
        })
      )
    : undefined
  return { public: knex(knexConfig), private: privateConfig }
}

export const getConnectionSettings = (
  knex: Knex.Knex
): {
  connectionString?: string
  ssl?: boolean
  application_name?: string
} => {
  return (knex.client as Knex.Knex.Client).connectionSettings
}

export const obfuscateConnectionString = (connectionString: string): string => {
  const url = new URL(connectionString)
  const obfuscatedUrl = new URL(url)
  obfuscatedUrl.password = '****'
  return obfuscatedUrl.toString()
}
