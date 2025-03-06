import { parseEnv } from 'znv'
import { z } from 'zod'

// Convenience variable to override below individual feature flags, which has the effect of setting all to 'false' (disabled)
// Takes precedence over ENABLE_ALL_FFS
const isDisableAllFFsMode = () =>
  ['true', '1'].includes(process.env.DISABLE_ALL_FFS || '')

// Convenience variable to override below individual feature flags, which has the effect of setting all to 'true' (enabled)
// This requires a valid Speckle Enterprise Edition license in order to be enabled.
// See https://github.com/specklesystems/speckle-server?tab=License-1-ov-file#readme
const isEnableAllFFsMode = () =>
  ['true', '1'].includes(process.env.ENABLE_ALL_FFS || '')

const parseFeatureFlags = () => {
  //INFO
  // As a convention all feature flags should be prefixed with a FF_
  const res = parseEnv(process.env, {
    // Enables the automate module.
    // Requires FF_GATEKEEPER_MODULE_ENABLED and FF_WORKSPACES_MODULE_ENABLED to be true
    // This requires a valid Speckle Enterprise Edition license in order to be enabled.
    // See https://github.com/specklesystems/speckle-server?tab=License-1-ov-file#readme
    FF_AUTOMATE_MODULE_ENABLED: {
      schema: z.boolean(),
      defaults: { _: false }
    },
    // Enables the gendo ai integration
    FF_GENDOAI_MODULE_ENABLED: {
      schema: z.boolean(),
      defaults: { _: false }
    },
    // Enables the workspaces module
    // Requires FF_GATEKEEPER_MODULE_ENABLED to be true
    // This requires a valid Speckle Enterprise Edition license in order to be enabled.
    // See https://github.com/specklesystems/speckle-server?tab=License-1-ov-file#readme
    FF_WORKSPACES_MODULE_ENABLED: {
      schema: z.boolean(),
      defaults: { _: false }
    },
    // Enables the new (under development as of Q1 2025) plans for workspaces
    // Requires FF_GATEKEEPER_MODULE_ENABLED and FF_WORKSPACES_MODULE_ENABLED to be true
    // This is expected to be a temporary flag, to be removed once the new plans are stable
    // See https://linear.app/speckle/initiative/new-pricing-and-packaging-f3c6c8ada825/overview
    // This requires a valid Speckle Enterprise Edition license in order to be enabled.
    // See https://github.com/specklesystems/speckle-server?tab=License-1-ov-file#readme
    FF_WORKSPACES_NEW_PLANS_ENABLED: {
      schema: z.boolean(),
      defaults: { _: false }
    },
    // Enables free plans for workspaces
    // Requires FF_GATEKEEPER_MODULE_ENABLED and FF_WORKSPACES_MODULE_ENABLED to be true
    // This is expected to be a temporary flag, to be removed once the new plans are stable
    // See https://linear.app/speckle/initiative/new-pricing-and-packaging-f3c6c8ada825/overview
    // This requires a valid Speckle Enterprise Edition license in order to be enabled.
    // See https://github.com/specklesystems/speckle-server?tab=License-1-ov-file#readme
    FF_GATEKEEPER_FORCE_FREE_PLAN: {
      schema: z.boolean(),
      defaults: { _: false }
    },
    // Enables the 'gatekeeper', required for enabling licensed features
    // This requires a valid Speckle Enterprise Edition license in order to be enabled.
    // See https://github.com/specklesystems/speckle-server?tab=License-1-ov-file#readme
    FF_GATEKEEPER_MODULE_ENABLED: {
      schema: z.boolean(),
      defaults: { _: false }
    },
    // Enables Stripe billing integration
    // This is expected to be disabled in Enterprise and self-hosted deployments, but enabled in app.speckle.systems
    // Requires FF_GATEKEEPER_MODULE_ENABLED and FF_WORKSPACES_MODULE_ENABLED to be true
    // This requires a valid Speckle Enterprise Edition license in order to be enabled.
    // See https://github.com/specklesystems/speckle-server?tab=License-1-ov-file#readme
    FF_BILLING_INTEGRATION_ENABLED: {
      schema: z.boolean(),
      defaults: { _: false }
    },
    // Enables using dynamic SSO on a per workspace basis
    // Requires FF_GATEKEEPER_MODULE_ENABLED and FF_WORKSPACES_MODULE_ENABLED to be true
    // This requires a valid Speckle Enterprise Edition license in order to be enabled.
    // See https://github.com/specklesystems/speckle-server?tab=License-1-ov-file#readme
    FF_WORKSPACES_SSO_ENABLED: {
      schema: z.boolean(),
      defaults: { _: false }
    },
    // Enables the multiple emails module
    FF_MULTIPLE_EMAILS_MODULE_ENABLED: {
      schema: z.boolean(),
      defaults: { _: false }
    },
    // Enables workspaces multi region DB support
    // Requires FF_GATEKEEPER_MODULE_ENABLED and FF_WORKSPACES_MODULE_ENABLED to be true
    // This requires a valid Speckle Enterprise Edition license in order to be enabled.
    // See https://github.com/specklesystems/speckle-server?tab=License-1-ov-file#readme
    FF_WORKSPACES_MULTI_REGION_ENABLED: {
      schema: z.boolean(),
      defaults: { _: false }
    },
    // Toggles IFC parsing with experimental .Net parser
    // Development project as of Q1 2025. Intention is to evaluate the performance of the .Net parser and remove this flag once the parser is stable.
    // See https://linear.app/speckle/project/ifc-ecaffd5eb1c2/overview
    FF_FILEIMPORT_IFC_DOTNET_ENABLED: {
      schema: z.boolean(),
      defaults: { _: false }
    },
    // Forces onboarding for all users
    FF_FORCE_ONBOARDING: {
      schema: z.boolean(),
      defaults: { _: false }
    },
    // Enable to not allow personal emails
    FF_NO_PERSONAL_EMAILS_ENABLED: {
      schema: z.boolean(),
      defaults: { _: false }
    },
    // Enables endpoint(s) for updating a project's region
    // Requires FF_WORKSPACES_MULTI_REGION_ENABLED to be true (which indirectly requires FF_GATEKEEPER_MODULE_ENABLED and FF_WORKSPACES_MODULE_ENABLED to be true)
    // This requires a valid Speckle Enterprise Edition license in order to be enabled.
    // See https://github.com/specklesystems/speckle-server?tab=License-1-ov-file#readme
    FF_MOVE_PROJECT_REGION_ENABLED: {
      schema: z.boolean(),
      defaults: { _: false }
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

let parsedFlags: ReturnType<typeof parseFeatureFlags> | undefined

export function getFeatureFlags(): {
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
  FF_MOVE_PROJECT_REGION_ENABLED: boolean
  FF_NO_PERSONAL_EMAILS_ENABLED: boolean
} {
  if (!parsedFlags) parsedFlags = parseFeatureFlags()
  return parsedFlags
}
