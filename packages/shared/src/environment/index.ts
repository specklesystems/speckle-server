import { parseEnv } from 'znv'
import { z } from 'zod'

const isDisableAllFFsMode = () =>
  ['true', '1'].includes(process.env.DISABLE_ALL_FFS || '')
const isEnableAllFFsMode = () =>
  ['true', '1'].includes(process.env.ENABLE_ALL_FFS || '')

export const parseFeatureFlags = (
  input: // | Record<string, string | undefined>
  Partial<Record<keyof FeatureFlags, 'true' | 'false' | undefined>>
): FeatureFlags => {
  //INFO
  // As a convention all feature flags should be prefixed with a FF_
  const res = parseEnv(input, {
    // Enables the admin override feature
    FF_ADMIN_OVERRIDE_ENABLED: {
      schema: z.boolean(),
      defaults: { production: false, _: false }
    },
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
    FF_WORKSPACES_NEW_PLANS_ENABLED: {
      schema: z.boolean(),
      defaults: { production: false, _: true }
    },
    FF_GATEKEEPER_FORCE_FREE_PLAN: {
      schema: z.boolean(),
      defaults: { production: false, _: false }
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
    // Forces onboarding for all users
    FF_FORCE_ONBOARDING: {
      schema: z.boolean(),
      defaults: { production: false, _: false }
    },
    // Enable to not allow personal emails
    FF_NO_PERSONAL_EMAILS_ENABLED: {
      schema: z.boolean(),
      defaults: { production: false, _: false }
    },
    // Fixes the streaming of objects by ensuring that the database stream is closed properly
    FF_OBJECTS_STREAMING_FIX: {
      schema: z.boolean(),
      defaults: { production: false, _: false }
    },
    // Enables endpoint(s) for updating a project's region
    FF_MOVE_PROJECT_REGION_ENABLED: {
      schema: z.boolean(),
      defaults: { production: false, _: true }
    }
  })

  // Can be used to disable/enable all feature flags for testing purposes
  if (isDisableAllFFsMode() || isEnableAllFFsMode()) {
    for (const key of Object.keys(res)) {
      ;(res as Record<string, boolean>)[key] = !isDisableAllFFsMode() // disable takes precedence
    }
  }

  return res
}

let parsedFlags: FeatureFlags | undefined

export type FeatureFlags = {
  FF_ADMIN_OVERRIDE_ENABLED: boolean
  FF_AUTOMATE_MODULE_ENABLED: boolean
  FF_GENDOAI_MODULE_ENABLED: boolean
  FF_WORKSPACES_MODULE_ENABLED: boolean
  FF_WORKSPACES_NEW_PLANS_ENABLED: boolean
  FF_WORKSPACES_SSO_ENABLED: boolean
  FF_GATEKEEPER_MODULE_ENABLED: boolean
  FF_GATEKEEPER_FORCE_FREE_PLAN: boolean
  FF_BILLING_INTEGRATION_ENABLED: boolean
  FF_WORKSPACES_MULTI_REGION_ENABLED: boolean
  FF_FILEIMPORT_IFC_DOTNET_ENABLED: boolean
  FF_FORCE_ONBOARDING: boolean
  FF_OBJECTS_STREAMING_FIX: boolean
  FF_MOVE_PROJECT_REGION_ENABLED: boolean
  FF_NO_PERSONAL_EMAILS_ENABLED: boolean
}

export function getFeatureFlags(): FeatureFlags {
  //@ts-expect-error this way, the parse function typing is a lot better
  if (!parsedFlags) parsedFlags = parseFeatureFlags(process.env)
  return parsedFlags
}
