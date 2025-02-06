import { parseEnv } from 'znv'
import { z } from 'zod'

const isDisableAllFFsMode = () =>
  ['true', '1'].includes(process.env.DISABLE_ALL_FFS || '')

const parseFeatureFlags = () => {
  //INFO
  // As a convention all feature flags should be prefixed with a FF_
  const res = parseEnv(process.env, {
    // Enables the automate module.
    FF_AUTOMATE_MODULE_ENABLED: {
      schema: z.boolean(),
      defaults: { production: false, _: true }
    },
    // Enables the gendo ai integration
    FF_GENDOAI_MODULE_ENABLED: {
      schema: z.boolean(),
      defaults: { production: false, _: false }
    },
    // Enables the workspaces module
    FF_WORKSPACES_MODULE_ENABLED: {
      schema: z.boolean(),
      defaults: { production: false, _: true }
    },
    FF_GATEKEEPER_MODULE_ENABLED: {
      schema: z.boolean(),
      defaults: { production: false, _: true }
    },
    FF_BILLING_INTEGRATION_ENABLED: {
      schema: z.boolean(),
      defaults: { production: false, _: false }
    },
    // Enables using dynamic SSO on a per workspace basis
    FF_WORKSPACES_SSO_ENABLED: {
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
    },
    // Enables workspaces multi region DB support
    FF_WORKSPACES_MULTI_REGION_ENABLED: {
      schema: z.boolean(),
      defaults: { production: false, _: false }
    },
    // Toggles IFC parsing with experimental .Net parser
    FF_FILEIMPORT_IFC_DOTNET_ENABLED: {
      schema: z.boolean(),
      defaults: { production: false, _: false }
    },
    // Forces email verification for all users
    FF_FORCE_EMAIL_VERIFICATION: {
      schema: z.boolean(),
      defaults: { production: false, _: false }
    },
    // Forces onboarding for all users
    FF_FORCE_ONBOARDING: {
      schema: z.boolean(),
      defaults: { production: false, _: false }
    },
    // Enables the caching of the auth pipeline in Redis
    FF_CACHE_AUTH_PIPELINE: {
      schema: z.boolean(),
      defaults: { production: false, _: true }
    }
  })

  // Can be used to disable all feature flags for testing purposes
  if (isDisableAllFFsMode()) {
    for (const key of Object.keys(res)) {
      ;(res as Record<string, boolean>)[key] = false
    }
  }

  return res
}

let parsedFlags: ReturnType<typeof parseFeatureFlags> | undefined

export function getFeatureFlags(): {
  FF_AUTOMATE_MODULE_ENABLED: boolean
  FF_GENDOAI_MODULE_ENABLED: boolean
  FF_NO_CLOSURE_WRITES: boolean
  FF_WORKSPACES_MODULE_ENABLED: boolean
  FF_WORKSPACES_SSO_ENABLED: boolean
  FF_GATEKEEPER_MODULE_ENABLED: boolean
  FF_BILLING_INTEGRATION_ENABLED: boolean
  FF_WORKSPACES_MULTI_REGION_ENABLED: boolean
  FF_FILEIMPORT_IFC_DOTNET_ENABLED: boolean
  FF_FORCE_EMAIL_VERIFICATION: boolean
  FF_FORCE_ONBOARDING: boolean
  FF_CACHE_AUTH_PIPELINE: boolean
} {
  if (!parsedFlags) parsedFlags = parseFeatureFlags()
  return parsedFlags
}
