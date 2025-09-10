import { has } from '#lodash'
import { parseEnv } from 'znv'
import { z } from 'zod'
import { FeatureFlags } from './featureFlags.js'

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
     * Whether to prevent inputs from being overridden by disable/enable all
     * Default: true
     */
    forceInputs: boolean
  }>
): FeatureFlags => {
  const { forceInputs = true } = options || {}

  // Clean up input: unset empty values
  for (const key of Object.keys(input)) {
    const typedKey = key as keyof FeatureFlags
    const typedVal = input[typedKey] as unknown

    if (typedVal === undefined || typedVal === '') {
      delete input[typedKey]
    }
  }

  //INFO
  // As a convention all feature flags should be prefixed with a FF_
  const res = parseEnv(input, {
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
    FF_MOVE_PROJECT_REGION_ENABLED: {
      schema: z.boolean(),
      description:
        "Enables endpoint(s) for updating a project's region. Requires FF_WORKSPACES_MULTI_REGION_ENABLED to be true (which indirectly requires FF_GATEKEEPER_MODULE_ENABLED and FF_WORKSPACES_MODULE_ENABLED to be true. This requires a valid Speckle Enterprise Edition license in order to be enabled, see https://github.com/specklesystems/speckle-server?tab=License-1-ov-file#readme",
      defaults: { _: false }
    },
    FF_PERSONAL_PROJECTS_LIMITS_ENABLED: {
      schema: z.boolean(),
      defaults: { _: false }
    },
    // Enables retrying errored previews
    FF_RETRY_ERRORED_PREVIEWS_ENABLED: {
      schema: z.boolean(),
      description: 'Allows the retrying of previews which have previously failed.',
      defaults: { _: false }
    },
    FF_NEXT_GEN_FILE_IMPORTER_ENABLED: {
      schema: z.boolean(),
      description: 'Enables the new file importer.',
      defaults: { _: false }
    },
    FF_RHINO_FILE_IMPORTER_ENABLED: {
      schema: z.boolean(),
      description: 'Enables the Rhino based file importer.',
      defaults: { _: false }
    },
    FF_LEGACY_FILE_IMPORTS_ENABLED: {
      schema: z.boolean(),
      description:
        'Enables the legacy file importer. This proxies file uploads via REST API on the server instead of directly PUTing files to S3 via pre-signed urls.',
      defaults: { _: false }
    },
    FF_ACC_INTEGRATION_ENABLED: {
      schema: z.boolean(),
      description:
        'Enables the integration with ACC. This synchronizes models with specified ACC assets.',
      defaults: { _: false }
    },
    FF_DASHBOARDS_MODULE_ENABLED: {
      schema: z.boolean(),
      description: 'Enables the dashboards module.',
      defaults: { _: false }
    },
    FF_SAVED_VIEWS_ENABLED: {
      schema: z.boolean(),
      description: 'Enables the saved views feature for project models',
      defaults: { _: false }
    },
    FF_USERS_INVITE_SCOPE_IS_PUBLIC: {
      schema: z.boolean(),
      description:
        'Enables Personal Access Tokens (PAT) to be created with users:invite scope. **WARNING** This can be used to spam invitations to any email address. It is not advised to enable this on servers which are open to public account registration or to which untrusted users have been, or can be, invited.',
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

export function getFeatureFlags(): FeatureFlags {
  //@ts-expect-error this way, the parse function typing is a lot better
  if (!parsedFlags) parsedFlags = parseFeatureFlags(process.env, { forceInputs: false })
  return parsedFlags
}
