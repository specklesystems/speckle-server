import { has } from '#lodash'
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

export const parseFeatureFlags = (
  input: Partial<Record<keyof FeatureFlags, 'true' | 'false' | undefined>>,
  options?: Partial<{
    /**
     * Whether to prevent inputs from being overriden by disable/enable all
     * Default: true
     */
    forceInputs: boolean
  }>
): FeatureFlags => {
  const { forceInputs = true } = options || {}

  //INFO
  // As a convention all feature flags should be prefixed with a FF_
  const res = parseEnv(input, {
    // Enables the automate module.
    FF_AUTOMATE_MODULE_ENABLED: {
      schema: z.boolean(),
      description:
        'Enables the Automate module. Requires FF_GATEKEEPER_MODULE_ENABLED and FF_WORKSPACES_MODULE_ENABLED to be true. This requires a valid Speckle Enterprise Edition license in order to be enabled, see https://github.com/specklesystems/speckle-server?tab=License-1-ov-file#readme',
      defaults: { _: false }
    },
    FF_GENDOAI_MODULE_ENABLED: {
      schema: z.boolean(),
      description: 'Enables the gendo ai integration',
      defaults: { _: false }
    },
    //
    FF_WORKSPACES_MODULE_ENABLED: {
      schema: z.boolean(),
      description:
        'Enables the workspaces module. Requires FF_GATEKEEPER_MODULE_ENABLED to be true. This requires a valid Speckle Enterprise Edition license in order to be enabled, see https://github.com/specklesystems/speckle-server?tab=License-1-ov-file#readme',
      defaults: { _: false }
    },
    FF_GATEKEEPER_MODULE_ENABLED: {
      schema: z.boolean(),
      description:
        "Enables the 'gatekeeper', required for enabling licensed features. This requires a valid Speckle Enterprise Edition license in order to be enabled, see https://github.com/specklesystems/speckle-server?tab=License-1-ov-file#readme",
      defaults: { _: false }
    },
    // This is expected to be disabled in Enterprise and self-hosted deployments, but enabled in app.speckle.systems
    FF_BILLING_INTEGRATION_ENABLED: {
      schema: z.boolean(),
      description:
        'Enables Stripe billing integration. Requires FF_GATEKEEPER_MODULE_ENABLED and FF_WORKSPACES_MODULE_ENABLED to be true. This requires a valid Speckle Enterprise Edition license in order to be enabled, see https://github.com/specklesystems/speckle-server?tab=License-1-ov-file#readme',
      defaults: { _: false }
    },
    FF_WORKSPACES_SSO_ENABLED: {
      schema: z.boolean(),
      description:
        'Enables using dynamic SSO on a per workspace basis. Requires FF_GATEKEEPER_MODULE_ENABLED and FF_WORKSPACES_MODULE_ENABLED to be true. This requires a valid Speckle Enterprise Edition license in order to be enabled, see https://github.com/specklesystems/speckle-server?tab=License-1-ov-file#readme',
      defaults: { _: false }
    },
    FF_MULTIPLE_EMAILS_MODULE_ENABLED: {
      schema: z.boolean(),
      description:
        'Allows multiple email addresses to be associated with a single user',
      defaults: { _: false }
    },
    FF_WORKSPACES_MULTI_REGION_ENABLED: {
      schema: z.boolean(),
      description:
        'Enables workspaces multi region DB support. Requires FF_GATEKEEPER_MODULE_ENABLED and FF_WORKSPACES_MODULE_ENABLED to be true. This requires a valid Speckle Enterprise Edition license in order to be enabled.  See https://github.com/specklesystems/speckle-server?tab=License-1-ov-file#readme',
      defaults: { _: false }
    },
    // Forces onboarding for all users
    FF_FORCE_ONBOARDING: {
      schema: z.boolean(),
      description: 'Forces onboarding flow for all users',
      defaults: { _: false }
    },
    FF_NO_PERSONAL_EMAILS_ENABLED: {
      schema: z.boolean(),
      description: 'Enable to not allow personal emails',
      defaults: { _: false }
    },
    //
    FF_MOVE_PROJECT_REGION_ENABLED: {
      schema: z.boolean(),
      description:
        "Enables endpoint(s) for updating a project's region. Requires FF_WORKSPACES_MULTI_REGION_ENABLED to be true (which indirectly requires FF_GATEKEEPER_MODULE_ENABLED and FF_WORKSPACES_MODULE_ENABLED to be true. This requires a valid Speckle Enterprise Edition license in order to be enabled, see https://github.com/specklesystems/speckle-server?tab=License-1-ov-file#readme",
      defaults: { _: false }
    },
    // Enable limits on personal projects
    FF_PERSONAL_PROJECTS_LIMITS_ENABLED: {
      schema: z.boolean(),
      description:
        'Enables limits on personal projects. Requires FF_GATEKEEPER_MODULE_ENABLED and FF_WORKSPACES_MODULE_ENABLED to be true. This requires a valid Speckle Enterprise Edition license in order to be enabled, see https://github.com/specklesystems/speckle-server?tab=License-1-ov-file#readme',
      defaults: { _: false }
    },
    // Enables the new file importer
    FF_NEXT_GEN_FILE_IMPORTER_ENABLED: {
      schema: z.boolean(),
      description: 'Enables the new file importer.',
      defaults: { _: false }
    }
  })

  // Can be used to disable/enable all feature flags for testing purposes
  if (isDisableAllFFsMode() || isEnableAllFFsMode()) {
    for (const key of Object.keys(res)) {
      if (forceInputs && has(input, key)) {
        continue // skip if we are forcing inputs
      }

      ;(res as Record<string, boolean>)[key] = !isDisableAllFFsMode() // disable takes precedence
    }
  }

  return res
}

let parsedFlags: FeatureFlags | undefined

export type FeatureFlags = {
  FF_AUTOMATE_MODULE_ENABLED: boolean
  FF_GENDOAI_MODULE_ENABLED: boolean
  FF_WORKSPACES_MODULE_ENABLED: boolean
  FF_WORKSPACES_SSO_ENABLED: boolean
  FF_GATEKEEPER_MODULE_ENABLED: boolean
  FF_BILLING_INTEGRATION_ENABLED: boolean
  FF_WORKSPACES_MULTI_REGION_ENABLED: boolean
  FF_FORCE_ONBOARDING: boolean
  FF_MOVE_PROJECT_REGION_ENABLED: boolean
  FF_NO_PERSONAL_EMAILS_ENABLED: boolean
  FF_PERSONAL_PROJECTS_LIMITS_ENABLED: boolean
  FF_NEXT_GEN_FILE_IMPORTER_ENABLED: boolean
}

export function getFeatureFlags(): FeatureFlags {
  //@ts-expect-error this way, the parse function typing is a lot better
  if (!parsedFlags) parsedFlags = parseFeatureFlags(process.env, { forceInputs: false })
  return parsedFlags
}
