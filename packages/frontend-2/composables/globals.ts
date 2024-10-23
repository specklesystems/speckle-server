import { useActiveUser } from '~/lib/auth/composables/activeUser'
import { usePageQueryStandardFetchPolicy } from '~/lib/common/composables/graphql'
import { useGlobalToast } from '~/lib/common/composables/toast'

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

export const useIsMultipleEmailsEnabled = () => {
  const {
    public: { FF_MULTIPLE_EMAILS_MODULE_ENABLED }
  } = useRuntimeConfig()

  return ref(FF_MULTIPLE_EMAILS_MODULE_ENABLED)
}

export const useIsGendoModuleEnabled = () => {
  const {
    public: { FF_GENDOAI_MODULE_ENABLED }
  } = useRuntimeConfig()
  return ref(FF_GENDOAI_MODULE_ENABLED)
}

export const useIsBillingIntegrationEnabled = () => {
  const {
    public: { FF_BILLING_INTEGRATION_ENABLED }
  } = useRuntimeConfig()
  return ref(FF_BILLING_INTEGRATION_ENABLED)
}

export { useGlobalToast, useActiveUser, usePageQueryStandardFetchPolicy }
