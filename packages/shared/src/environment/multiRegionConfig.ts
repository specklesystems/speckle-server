import { z } from 'zod'
import fs from 'node:fs/promises'
import { Knex, knex } from 'knex'
import { Logger } from 'pino'
import { getFeatureFlags } from './index.js'

const useV1Config = !getFeatureFlags().FF_WORKSPACES_MULTI_REGION_BLOB_STORAGE_ENABLED

const regionConfigSchemaV1 = z.object({
  postgres: z.object({
    connectionUri: z
      .string()
      .describe(
        'Full Postgres connection URI (e.g. "postgres://user:password@host:port/dbname")'
      ),
    privateConnectionUri: z
      .string()
      .describe(
        'Full Postgres connection URI in VPN or Docker networks (e.g. "postgres://user:password@host:port/dbname")'
      )
      .optional(),
    publicTlsCertificate: z
      .string()
      .describe('Public TLS ("CA") certificate for the Postgres server')
      .optional()
  })
})

const regionConfigSchema = regionConfigSchemaV1.extend({
  blobStorage: z.object({
    endpoint: z.string().url(),
    accessKey: z.string(),
    secretKey: z.string(),
    bucket: z.string(),
    createBucketIfNotExists: z.boolean(),
    s3Region: z.string()
  })
})

const multiRegionConfigV1Schema = z.object({
  main: regionConfigSchemaV1,
  regions: z.record(z.string(), regionConfigSchemaV1)
})

const multiRegionConfigSchema = z.object({
  main: regionConfigSchema,
  regions: z.record(z.string(), regionConfigSchema)
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
  } catch (e) {
    throw new Error(`Multi-region config file at path '${path}' is not valid JSON`)
  }

  const schema = useV1Config ? multiRegionConfigV1Schema : multiRegionConfigSchema
  const multiRegionConfigFileResult = schema.safeParse(parsedJson) // This will throw if the config is invalid
  if (!multiRegionConfigFileResult.success)
    throw new Error(
      `Multi-region config file at path '${path}' does not fit the schema: ${multiRegionConfigFileResult.error}`
    )

  // Type assertion should be fine cause the FF should be temporary AND v1 logic should not even
  // try to access the extra blobStorage fields anyway
  return multiRegionConfigFileResult.data as MultiRegionConfig
}

export type KnexConfigArgs = {
  migrationDirs: string[]
  isTestEnv: boolean
  isDevOrTestEnv: boolean
  logger: Logger
  maxConnections: number
  applicationName: string
  connectionAcquisitionTimeoutMillis: number
  connectionCreateTimeoutMillis: number
}

export const createKnexConfig = ({
  connectionString,
  migrationDirs,
  isTestEnv,
  isDevOrTestEnv,
  logger,
  maxConnections,
  caCertificate,
  connectionAcquisitionTimeoutMillis,
  connectionCreateTimeoutMillis
}: {
  connectionString?: string | undefined
  caCertificate?: string | undefined
} & KnexConfigArgs): Knex.Config => {
  return {
    client: 'pg',
    migrations: {
      extension: 'ts',
      loadExtensions: isTestEnv ? ['.js', '.ts'] : ['.js'],
      directory: migrationDirs
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
    asyncStackTraces: isDevOrTestEnv,
    pool: {
      min: 0,
      max: maxConnections,
      acquireTimeoutMillis: connectionAcquisitionTimeoutMillis, // If the maximum number of connections is reached, it wait for 16 seconds trying to acquire an existing connection before throwing a timeout error.
      createTimeoutMillis: connectionCreateTimeoutMillis // If no existing connection is available and the maximum number of connections is not yet reached, the pool will try to create a new connection for 5 seconds before throwing a timeout error.
      // createRetryIntervalMillis: 200, // Irrelevant & ignored because propogateCreateError is true.
      // propagateCreateError: true // The propagateCreateError is set to true by default in Knex and throws a TimeoutError if the first create connection to the database fails. Knex recommends that this value is NOT set to false, despite what 'helpful' people on Stackoverflow tell you: https://github.com/knex/knex/issues/3455#issuecomment-535554401
    }
  }
}

export const configureKnexClient = (
  config: Pick<RegionServerConfig, 'postgres'>,
  configArgs: KnexConfigArgs
): { public: Knex; private?: Knex } => {
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
