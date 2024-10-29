import { z } from 'zod'

export const regionServerConfigSchema = z.object({
  postgres: z.object({
    connectionUri: z.string().url(),
    publicTlsCertificate: z.string()
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

export const multiRegionConfigSchema = z.record(z.string(), regionServerConfigSchema)

export type MultiRegionConfig = z.infer<typeof multiRegionConfigSchema>
