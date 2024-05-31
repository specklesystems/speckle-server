import { parseEnv } from 'znv'
import { z } from 'zod'

function parseFeatureFlags() {
  //INFO
  // As a convention all feature flags should be prefixed with a FF_
  const featureFlagSchema = z.object({
    FF_AUTOMATE_MODULE_ENABLED: z.boolean().default(false),
    FF_GENDOAI_MODULE_ENABLED: z.boolean().default(false)
  })
  return parseEnv(process.env, featureFlagSchema.shape)
}

let parsedFlags: ReturnType<typeof parseFeatureFlags> | undefined

export function getFeatureFlags() {
  if (!parsedFlags) parsedFlags = parseFeatureFlags()
  return parsedFlags
}
