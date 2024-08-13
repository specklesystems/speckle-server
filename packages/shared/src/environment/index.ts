import { parseEnv } from 'znv'
import { z } from 'zod'

function parseFeatureFlags() {
  //INFO
  // As a convention all feature flags should be prefixed with a FF_
  return parseEnv(process.env, {
    // Enables the automate module.
    FF_AUTOMATE_MODULE_ENABLED: {
      schema: z.boolean(),
      defaults: { production: false, _: true }
    },
    // Enables the gendo ai integration
    FF_GENDOAI_MODULE_ENABLED: {
      schema: z.boolean(),
      defaults: { production: false, _: true }
    },
    // Enables the workspaces module
    FF_WORKSPACES_MODULE_ENABLED: {
      schema: z.boolean(),
      defaults: { production: false, _: true }
    },
    // Enables the multiple emails module
    FF_MULTIPLE_EMAILS_MODULE_ENABLED: {
      schema: z.boolean(),
      defaults: { production: false, _: true }
    },
    // Disables writing to the closure table in the create objects batched services (re object upload routes)
    FF_NO_CLOSURE_WRITES: {
      schema: z.boolean(),
      defaults: { production: false, _: false }
    }
  })
}

let parsedFlags: ReturnType<typeof parseFeatureFlags> | undefined

export function getFeatureFlags(): {
  FF_AUTOMATE_MODULE_ENABLED: boolean
  FF_GENDOAI_MODULE_ENABLED: boolean
  FF_NO_CLOSURE_WRITES: boolean
  FF_WORKSPACES_MODULE_ENABLED: boolean
} {
  if (!parsedFlags) parsedFlags = parseFeatureFlags()
  return parsedFlags
}
