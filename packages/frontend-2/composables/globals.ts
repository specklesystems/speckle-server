import { useActiveUser } from '~/lib/auth/composables/activeUser'
import { usePageQueryStandardFetchPolicy } from '~/lib/common/composables/graphql'
import { useGlobalToast } from '~/lib/common/composables/toast'
import { useEventBus } from '~/lib/core/composables/eventBus'

export const useIsAccModuleEnabled = () => {
  const {
    public: { FF_ACC_INTEGRATION_ENABLED }
  } = useRuntimeConfig()

  return ref(FF_ACC_INTEGRATION_ENABLED)
}

export const useIsAutomateModuleEnabled = () => {
  const {
    public: { FF_AUTOMATE_MODULE_ENABLED }
  } = useRuntimeConfig()

  return ref(FF_AUTOMATE_MODULE_ENABLED)
}

export const useIsWorkspacesEnabled = () => {
  const {
    public: { FF_WORKSPACES_MODULE_ENABLED }
  } = useRuntimeConfig()

  return ref(FF_WORKSPACES_MODULE_ENABLED)
}

export const useIsWorkspacesSsoEnabled = () => {
  const {
    public: { FF_WORKSPACES_SSO_ENABLED }
  } = useRuntimeConfig()

  return ref(FF_WORKSPACES_SSO_ENABLED)
}

export const useIsWorkspacesMultiRegionBlobStorageEnabled = () => {
  const {
    public: { FF_WORKSPACES_MULTI_REGION_ENABLED }
  } = useRuntimeConfig()

  return ref(FF_WORKSPACES_MULTI_REGION_ENABLED)
}

export const useIsMultipleEmailsEnabled = () => {
  const {
    public: { FF_MULTIPLE_EMAILS_MODULE_ENABLED }
  } = useRuntimeConfig()

  return ref(FF_MULTIPLE_EMAILS_MODULE_ENABLED)
}

export const useIsOnboardingForced = () => {
  const {
    public: { FF_FORCE_ONBOARDING }
  } = useRuntimeConfig()

  return ref(FF_FORCE_ONBOARDING)
}

export const useWorkspaceNewPlansEnabled = () => {
  return ref(true)
}

export const useIsBillingIntegrationEnabled = () => {
  const {
    public: { FF_BILLING_INTEGRATION_ENABLED }
  } = useRuntimeConfig()
  return ref(FF_BILLING_INTEGRATION_ENABLED)
}

export const useIsRhinoFileImporterEnabled = () => {
  const {
    public: { FF_RHINO_FILE_IMPORTER_ENABLED }
  } = useRuntimeConfig()
  return ref(FF_RHINO_FILE_IMPORTER_ENABLED)
}

export const useIsNoPersonalEmailsEnabled = () => {
  const {
    public: { FF_NO_PERSONAL_EMAILS_ENABLED }
  } = useRuntimeConfig()

  return ref(FF_NO_PERSONAL_EMAILS_ENABLED)
}

export const useIsDashboardsModuleEnabled = () => {
  const {
    public: { FF_DASHBOARDS_MODULE_ENABLED }
  } = useRuntimeConfig()
  return ref(FF_DASHBOARDS_MODULE_ENABLED)
}

export { useGlobalToast, useActiveUser, usePageQueryStandardFetchPolicy, useEventBus }
