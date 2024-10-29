import { z } from 'zod'

export const regionServerConfig = z.object({
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

export type RegionServerConfig = z.infer<typeof regionServerConfig>
