import { z } from 'zod'

const EnabledModules = z
  .object({
    workspaces: z.boolean(),
    gatekeeper: z.boolean(),
    billing: z.boolean()
  })
  .partial()

export type EnabledModules = z.infer<typeof EnabledModules>

export const LicenseTokenClaims = z.object({
  allowedDomains: z.string().array(),
  enabledModules: EnabledModules
})

export type LicenseTokenClaims = z.infer<typeof LicenseTokenClaims>
