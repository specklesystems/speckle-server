import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql/gql'
import type { WorkspaceSsoCheckQuery } from '~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~/lib/core/composables/mp'
import { workspaceSsoCheckQuery } from '~/lib/workspaces/graphql/queries'
import type {
  WorkspaceSsoError,
  WorkspaceSsoProviderPublic
} from '~/lib/workspaces/helpers/types'

/**
 * Fetches and provides public SSO workspace information from the rest api.
 * This is used to determine if a workspace has SSO enabled before authentication
 */
export function useWorkspacePublicSsoCheck(workspaceSlug: string) {
  const apiOrigin = useApiOrigin()
  const logger = useLogger()

  const {
    data: workspace,
    status: loading,
    error
  } = useFetch<WorkspaceSsoProviderPublic>(
    new URL(`/api/v1/workspaces/${workspaceSlug}/sso`, apiOrigin).toString(),
    {
      onResponseError: (err) => {
        logger.error('Failed to fetch workspace SSO provider:', err)
      }
    }
  )

  const hasSsoEnabled = computed(() => !!workspace.value?.ssoProviderName)

  return {
    workspace,
    loading,
    error,
    hasSsoEnabled
  }
}

/**
 * Checks if a workspace requires SSO authentication and the current user's SSO status.
 * Used to enforce SSO login requirements for workspace access.
 */
export const useWorkspaceSsoStatus = (params: { workspaceSlug: string }) => {
  graphql(`
    fragment WorkspaceSsoStatus_Workspace on Workspace {
      id
      sso {
        provider {
          id
          name
          clientId
          issuerUrl
        }
      }
    }
  `)

  graphql(`
    fragment WorkspaceSsoStatus_User on User {
      expiredSsoSessions {
        id
        slug
      }
    }
  `)

  const { result, loading, error } = useQuery<WorkspaceSsoCheckQuery>(
    workspaceSsoCheckQuery,
    { slug: params.workspaceSlug }
  )

  const hasSsoEnabled = computed(() => !!result.value?.workspaceBySlug.sso?.provider)
  const provider = computed(() => result.value?.workspaceBySlug.sso?.provider)

  const needsSsoLogin = computed(() => {
    if (!result.value?.activeUser) return false
    return result.value.activeUser.expiredSsoSessions.some(
      (workspace) => workspace.slug === params.workspaceSlug
    )
  })

  const isSsoAuthenticated = computed(() => {
    return hasSsoEnabled.value && !needsSsoLogin.value
  })

  return {
    hasSsoEnabled,
    isSsoAuthenticated,
    needsSsoLogin,
    provider,
    loading,
    error
  }
}

/**
 * Validates SSO authentication requirements for a workspace.
 * Returns an error message if SSO login is required but not completed.
 */
export function useWorkspaceSsoValidation(workspaceSlug: string) {
  const logger = useLogger()
  const { hasSsoEnabled, needsSsoLogin, error } = useWorkspaceSsoStatus({
    workspaceSlug
  })

  const ssoError = computed(() => {
    if (error.value) {
      logger.error('SSO check failed:', error.value)
      return 'Failed to check workspace SSO requirements'
    }

    if (hasSsoEnabled.value && needsSsoLogin.value) {
      return 'You need to sign in with SSO to access this workspace.'
    }

    return null
  })

  return { ssoError }
}

/**
 * Provides functionality to remove SSO configuration from a workspace.
 * Only available to workspace administrators.
 */
export function useWorkspaceSsoDelete() {
  const apiOrigin = useApiOrigin()
  const { triggerNotification } = useGlobalToast()
  const mixpanel = useMixpanel()

  const deleteSsoProvider = async (workspaceSlug: string) => {
    try {
      const res = await fetch(
        new URL(`/api/v1/workspaces/${workspaceSlug}/sso`, apiOrigin),
        {
          method: 'DELETE',
          credentials: 'include'
        }
      )

      if (!res.ok) {
        const errorData = (await res.json()) as WorkspaceSsoError
        throw new Error(
          errorData?.message || `Failed to delete SSO provider (${res.status})`
        )
      }

      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'SSO provider removed',
        description: 'SSO provider was successfully removed'
      })

      mixpanel.track('Workspace SSO Provider Removed', {
        // eslint-disable-next-line camelcase
        workspace_slug: workspaceSlug
      })

      return true
    } catch (error) {
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to remove SSO provider',
        description:
          error instanceof Error ? error.message : 'An unexpected error occurred'
      })
      return false
    }
  }

  return {
    deleteSsoProvider
  }
}
