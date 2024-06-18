import { parseEnv } from 'znv'
import { z } from 'zod'

function parseFeatureFlags() {
  //INFO
  // As a convention all feature flags should be prefixed with a FF_
  const featureFlagSchema = z.object({
    // Enables the automate module.
    FF_AUTOMATE_MODULE_ENABLED: z.boolean().default(false),
    // Enables the gendo ai integration
    FF_GENDOAI_MODULE_ENABLED: z.boolean().default(false),
    // Disables writing to the closure table in the create objects batched services (re object upload routes)
    FF_NO_CLOSURE_WRITES: z.boolean().default(false)
  })
  return parseEnv(process.env, featureFlagSchema.shape)
}

let parsedFlags: ReturnType<typeof parseFeatureFlags> | undefined

export function getFeatureFlags(): {
  FF_AUTOMATE_MODULE_ENABLED: boolean
  FF_GENDOAI_MODULE_ENABLED: boolean
  FF_NO_CLOSURE_WRITES: boolean
} {
  if (!parsedFlags) parsedFlags = parseFeatureFlags()
  return parsedFlags
}
