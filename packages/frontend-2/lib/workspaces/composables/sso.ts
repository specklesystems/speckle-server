import { useMutation, useQuery } from '@vue/apollo-composable'
import type {
  WorkspaceRoleUpdateInput,
  WorkspaceSsoCheckQuery
} from '~/lib/common/generated/gql/graphql'
import { getFirstErrorMessage } from '~/lib/common/helpers/graphql'
import { workspaceRoute } from '~/lib/common/helpers/route'
import { useMixpanel } from '~/lib/core/composables/mp'
import {
  setDefaultRegionMutation,
  workspaceUpdateRoleMutation
} from '~/lib/workspaces/graphql/mutations'
import { workspaceSsoCheckQuery } from '~/lib/workspaces/graphql/queries'
import type {
  WorkspaceSsoError,
  WorkspaceSsoProviderPublic
} from '~/lib/workspaces/helpers/types'

export const useWorkspaceSso = (params: { workspaceSlug: string }) => {
  const { result, loading, error } = useQuery<WorkspaceSsoCheckQuery>(
    workspaceSsoCheckQuery,
    { slug: params.workspaceSlug }
  )

  const hasSsoEnabled = computed(() => !!result.value?.workspaceBySlug.sso?.provider)
  const provider = computed(() => result.value?.workspaceBySlug.sso?.provider ?? null)

  const isSsoAuthenticated = computed(() => {
    return hasSsoEnabled.value && !needsSsoLogin.value
  })

  const needsSsoLogin = computed(() => {
    if (!result.value?.activeUser) return false
    return result.value.activeUser.expiredSsoSessions.some(
      (workspace) => workspace.slug === params.workspaceSlug
    )
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

export function useWorkspaceSsoPublic(workspaceSlug: string) {
  const apiOrigin = useApiOrigin()
  const logger = useLogger()

  const workspace = ref<WorkspaceSsoProviderPublic>()
  const loading = ref(true)
  const error = ref<Error | null>(null)

  const hasSsoEnabled = computed(() => !!workspace.value?.ssoProviderName)

  onMounted(async () => {
    try {
      const res = await fetch(
        new URL(`/api/v1/workspaces/${workspaceSlug}/sso`, apiOrigin)
      )
      if (!res.ok) {
        const errorData = (await res.json()) as WorkspaceSsoError
        throw new Error(
          errorData?.message || `Failed to fetch workspace data: ${res.status}`
        )
      }

      const data = (await res.json()) as WorkspaceSsoProviderPublic
      workspace.value = data
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Unknown error')
      logger.error('Failed to fetch workspace data:', err)
    } finally {
      loading.value = false
    }
  })

  return {
    workspace,
    loading,
    error,
    hasSsoEnabled
  }
}

export const useWorkspaceUpdateRole = () => {
  const { mutate } = useMutation(workspaceUpdateRoleMutation)
  const { triggerNotification } = useGlobalToast()
  const mixpanel = useMixpanel()

  return async (input: WorkspaceRoleUpdateInput) => {
    const result = await mutate(
      { input },
      {
        update: (cache) => {
          if (!input.role) {
            cache.evict({
              id: getCacheId('WorkspaceCollaborator', input.userId)
            })

            modifyObjectField(
              cache,
              getCacheId('Workspace', input.workspaceId),
              'team',
              ({ helpers: { createUpdatedValue } }) => {
                return createUpdatedValue(({ update }) => {
                  update('totalCount', (totalCount) => totalCount - 1)
                })
              },
              {
                autoEvictFiltered: true
              }
            )
          }
        }
      }
    ).catch(convertThrowIntoFetchResult)

    if (result?.data) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: input.role ? 'User role updated' : 'User removed',
        description: input.role
          ? 'The user role has been updated'
          : 'The user has been removed from the workspace'
      })

      if (input.role) {
        mixpanel.track('Workspace User Role Updated', {
          newRole: input.role,
          // eslint-disable-next-line camelcase
          workspace_id: input.workspaceId
        })
      } else {
        mixpanel.track('Workspace User Removed', {
          // eslint-disable-next-line camelcase
          workspace_id: input.workspaceId
        })
      }
    } else {
      const errorMessage = getFirstErrorMessage(result?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: input.role ? 'Failed to update role' : 'Failed to remove user',
        description: errorMessage
      })
    }
  }
}

export const copyWorkspaceLink = async (slug: string) => {
  const { copy } = useClipboard()
  const { triggerNotification } = useGlobalToast()

  const url = new URL(workspaceRoute(slug), window.location.toString()).toString()

  await copy(url)
  triggerNotification({
    type: ToastNotificationType.Success,
    title: 'Copied workspace link to clipboard'
  })
}

export const useSetDefaultWorkspaceRegion = () => {
  const { mutate } = useMutation(setDefaultRegionMutation)
  const { triggerNotification } = useGlobalToast()

  return async (params: { workspaceId: string; regionKey: string }) => {
    const { workspaceId, regionKey } = params
    const res = await mutate({ workspaceId, regionKey }).catch(
      convertThrowIntoFetchResult
    )

    if (res?.data?.workspaceMutations.setDefaultRegion) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Default region set successfully'
      })
    } else {
      const err = getFirstErrorMessage(res?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to set default region',
        description: err
      })
    }

    return res?.data?.workspaceMutations.setDefaultRegion
  }
}

export function useSsoAuth(workspaceSlug: string) {
  const logger = useLogger()
  const ssoError = ref<string | null>(null)

  const { hasSsoEnabled, needsSsoLogin, error } = useWorkspaceSso({
    workspaceSlug
  })

  if (error.value) {
    logger.error('SSO check failed:', error.value)
    ssoError.value = 'Failed to check workspace SSO requirements'
  } else if (hasSsoEnabled.value && needsSsoLogin.value) {
    ssoError.value = 'You need to sign in with SSO to access this workspace.'
  }

  return { ssoError }
}

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
