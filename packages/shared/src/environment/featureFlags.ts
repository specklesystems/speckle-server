// IMPORTANT: This file should not import zod, its supposed to be browser compatible

let loadedFlags: FeatureFlags | undefined

const featureFlags = (<const>[
  'FF_AUTOMATE_MODULE_ENABLED',
  'FF_GENDOAI_MODULE_ENABLED',
  'FF_WORKSPACES_MODULE_ENABLED',
  'FF_WORKSPACES_SSO_ENABLED',
  'FF_GATEKEEPER_MODULE_ENABLED',
  'FF_BILLING_INTEGRATION_ENABLED',
  'FF_WORKSPACES_MULTI_REGION_ENABLED',
  'FF_FORCE_ONBOARDING',
  'FF_MOVE_PROJECT_REGION_ENABLED',
  'FF_NO_PERSONAL_EMAILS_ENABLED',
  'FF_RETRY_ERRORED_PREVIEWS_ENABLED',
  'FF_PERSONAL_PROJECTS_LIMITS_ENABLED',
  'FF_NEXT_GEN_FILE_IMPORTER_ENABLED',
  'FF_RHINO_FILE_IMPORTER_ENABLED',
  'FF_BACKGROUND_JOBS_ENABLED',
  'FF_LEGACY_FILE_IMPORTS_ENABLED',
  'FF_LEGACY_IFC_IMPORTER_ENABLED',
  'FF_EXPERIMENTAL_IFC_IMPORTER_ENABLED',
  'FF_SAVED_VIEWS_ENABLED'
]) satisfies Array<`FF_${string}`>

export type FeatureFlags = {
  [K in (typeof featureFlags)[number]]: boolean
}

/**
 * Load feature flags in-memory, so that @speckle/shared internals can use them too.
 * These are supposed to be initialized on app startup/bootstrapping
 */

export const loadFeatureFlags = (input?: Partial<FeatureFlags>): FeatureFlags => {
  const defaults: FeatureFlags = Object.fromEntries(
    featureFlags.map((flag) => [flag, false])
  ) as FeatureFlags

  loadedFlags = { ...defaults, ...input }
  return loadedFlags
}

export const getFeatureFlags = (): FeatureFlags => {
  if (!loadedFlags) loadedFlags = loadFeatureFlags()
  return loadedFlags
}

export const hasLoadedFeatureFlags = (): boolean => {
  return !!loadedFlags
}
