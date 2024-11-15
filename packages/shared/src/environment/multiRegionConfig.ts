import { z } from 'zod'
import fs from 'node:fs/promises'
import { Knex, knex } from 'knex'
import { Logger } from 'pino'

export const regionConfigSchema = z.object({
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
  //TODO - add the rest of the config when blob storage is implemented
  // blobStorage: z
  //   .object({
  //     endpoint: z.string().url(),
  //     accessKey: z.string(),
  //     secretKey: z.string(),
  //     bucket: z.string()
  //   })
})

export const multiRegionConfigSchema = z.object({
  main: regionConfigSchema,
  regions: z.record(z.string(), regionConfigSchema)
})

export type MultiRegionConfig = z.infer<typeof multiRegionConfigSchema>
export type MainRegionConfig = MultiRegionConfig['main']
export type DataRegionsConfig = MultiRegionConfig['regions']
export type RegionServerConfig = z.infer<typeof regionConfigSchema>

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

  const multiRegionConfigFileResult = multiRegionConfigSchema.safeParse(parsedJson) // This will throw if the config is invalid
  if (!multiRegionConfigFileResult.success)
    throw new Error(
      `Multi-region config file at path '${path}' does not fit the schema: ${multiRegionConfigFileResult.error}`
    )

  return multiRegionConfigFileResult.data
}

export type KnexConfigArgs = {
  migrationDirs: string[]
  isTestEnv: boolean
  isDevOrTestEnv: boolean
  logger: Logger
  maxConnections: number
  applicationName: string
}

export const createKnexConfig = ({
  connectionString,
  migrationDirs,
  isTestEnv,
  isDevOrTestEnv,
  logger,
  maxConnections,
  caCertificate
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
      acquireTimeoutMillis: 16000, //allows for 3x creation attempts plus idle time between attempts
      createTimeoutMillis: 5000
    }
  }
}

export const configureKnexClient = (
  config: RegionServerConfig,
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
