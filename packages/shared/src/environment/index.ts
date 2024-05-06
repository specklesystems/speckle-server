import { parseEnv } from 'znv'
import { z } from 'zod'

//INFO
// As a convention all feature flags should be prefixed with a FF_
const featureFlagSchema = z.object({
  FF_AUTOMATE_MODULE_ENABLED: z.boolean().default(true) // TODO: Set to default and figure out deployment settings
})

function parseFeatureFlags() {
  return parseEnv(process.env, featureFlagSchema.shape)
}

let parsedFlags: ReturnType<typeof parseFeatureFlags> | undefined

export function getFeatureFlags() {
  if (!parsedFlags) parsedFlags = parseFeatureFlags()
  return parsedFlags
}
