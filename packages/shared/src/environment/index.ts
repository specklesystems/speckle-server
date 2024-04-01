import { parseEnv } from 'znv'
import { z } from 'zod'

const featureFlagSchema = z.object({
  ENABLE_AUTOMATE_MODULE: z.boolean().default(false)
})

function parseFeatureFlags() {
  return parseEnv(process.env, featureFlagSchema.shape)
}

let parsedFlags: ReturnType<typeof parseFeatureFlags> | undefined

export function getFeatureFlags() {
  if (!parsedFlags) parsedFlags = parseFeatureFlags()
  return parsedFlags
}
