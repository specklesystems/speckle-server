import { z } from 'zod'

export const oidcProvider = z.object({
  providerName: z.string().min(1),
  clientId: z.string().min(5),
  clientSecret: z.string().min(1),
  issuerUrl: z.string().min(1).url()
})
