import { useApolloClient, useMutation, useQuery } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql/gql'
import type { WorkspaceSsoCheckQuery } from '~/lib/common/generated/gql/graphql'
import { getFirstErrorMessage } from '~/lib/common/helpers/graphql'
import { useMixpanel } from '~/lib/core/composables/mp'
import { deleteWorkspaceSsoProviderMutation } from '~/lib/workspaces/graphql/mutations'
import { workspaceSsoCheckQuery } from '~/lib/workspaces/graphql/queries'
import type { WorkspaceSsoProviderPublic } from '~/lib/workspaces/helpers/types'

/**
 * Fetches and provides public SSO workspace information from the rest api.
 * This is used to determine if a workspace has SSO enabled before authentication
 */
export const useWorkspacePublicSsoCheck = (workspaceSlug: Ref<string>) => {
  const apiOrigin = useApiOrigin()
  const logger = useLogger()

  const {
    data: workspace,
    status,
    error
  } = useFetch<WorkspaceSsoProviderPublic>(
    computed(() =>
      new URL(`/api/v1/workspaces/${workspaceSlug.value}/sso`, apiOrigin).toString()
    ),
    {
      onResponseError: (err) => {
        logger.error('Failed to fetch workspace SSO provider:', err)
      }
    }
  )

  const hasSsoEnabled = computed(() => !!workspace.value?.ssoProviderName)
  const loading = computed(() => status.value === 'pending')

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
export const useWorkspaceSsoStatus = (params: { workspaceSlug: Ref<string> }) => {
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
        session {
          validUntil
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

  const variables = computed(() => ({
    slug: params.workspaceSlug.value
  }))

  const { result, loading, error } = useQuery<WorkspaceSsoCheckQuery>(
    workspaceSsoCheckQuery,
    variables
  )

  const hasSsoEnabled = computed(() => !!result.value?.workspaceBySlug.sso?.provider)
  const provider = computed(() => result.value?.workspaceBySlug.sso?.provider)

  const needsSsoLogin = computed(() => {
    if (!result.value?.activeUser) return false
    return result.value.activeUser.expiredSsoSessions.some(
      (workspace) => workspace.slug === params.workspaceSlug.value
    )
  })

  const isSsoAuthenticated = computed(() => {
    if (!hasSsoEnabled.value) return false
    if (needsSsoLogin.value) return false

    const session = result.value?.workspaceBySlug.sso?.session
    return !!session && new Date(session.validUntil) > new Date()
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
export function useWorkspaceSsoValidation(workspaceSlug: Ref<string>) {
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
  const { triggerNotification } = useGlobalToast()
  const mixpanel = useMixpanel()
  const apollo = useApolloClient().client

  const { mutate: deleteSsoProviderMutation, loading } = useMutation(
    deleteWorkspaceSsoProviderMutation
  )

  const deleteSsoProvider = async (workspaceId: string) => {
    const result = await deleteSsoProviderMutation({
      workspaceId
    }).catch(convertThrowIntoFetchResult)

    if (result?.data?.workspaceMutations?.deleteSsoProvider) {
      // TODO: Better cache updates
      apollo.cache.evict({
        id: getCacheId('Workspace', workspaceId)
      })

      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'SSO provider removed',
        description: 'SSO provider was successfully removed'
      })

      mixpanel.track('Workspace SSO Provider Removed', {
        // eslint-disable-next-line camelcase
        workspace_id: workspaceId
      })

      return true
    } else {
      const errorMessage = getFirstErrorMessage(result?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to remove SSO provider',
        description: errorMessage
      })
      return false
    }
  }

  return {
    deleteSsoProvider,
    loading
  }
}
