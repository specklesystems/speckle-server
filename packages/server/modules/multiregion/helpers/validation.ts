import { z } from 'zod'

export const regionServerConfigSchema = z.object({
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
  main: regionServerConfigSchema,
  regions: z.record(
    z.string().refine((arg) => arg !== 'main', {
      message:
        '"main" is a protected region key and cannot be used. Please use another key for the region.'
    }),
    regionServerConfigSchema
  )
})
