import { useQuery, useMutation, useApolloClient } from '@vue/apollo-composable'
import { discoverableWorkspacesQuery } from '~/lib/workspaces/graphql/queries'
import {
  dismissDiscoverableWorkspaceMutation,
  requestToJoinWorkspaceMutation
} from '~/lib/workspaces/graphql/mutations'
import { graphql } from '~/lib/common/generated/gql'
import { useMixpanel } from '~/lib/core/composables/mp'
import type { CacheObjectReference } from '~~/lib/common/helpers/graphql'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage,
  getCacheId
} from '~~/lib/common/helpers/graphql'

graphql(`
  fragment DiscoverableWorkspace_LimitedWorkspace on LimitedWorkspace {
    id
    name
    logo
    description
    slug
    team {
      totalCount
      items {
        user {
          id
          name
          avatar
        }
      }
    }
  }
`)

graphql(`
  fragment WorkspaceJoinRequests_LimitedWorkspaceJoinRequest on LimitedWorkspaceJoinRequest {
    id
    status
    workspace {
      id
      name
      logo
      slug
      team {
        totalCount
        items {
          user {
            id
            name
            avatar
          }
        }
      }
    }
  }
`)

export const useDiscoverableWorkspaces = () => {
  const isWorkspacesEnabled = useIsWorkspacesEnabled()

  const { result, loading, refetch } = useQuery(
    discoverableWorkspacesQuery,
    undefined,
    {
      enabled: isWorkspacesEnabled
    }
  )

  const { mutate: requestToJoin } = useMutation(requestToJoinWorkspaceMutation)
  const { mutate: dismissWorkspace } = useMutation(dismissDiscoverableWorkspaceMutation)

  const { activeUser } = useActiveUser()
  const mixpanel = useMixpanel()
  const { triggerNotification } = useGlobalToast()
  const apollo = useApolloClient().client

  const discoverableWorkspaces = computed(
    () => result.value?.activeUser?.discoverableWorkspaces
  )

  const workspaceJoinRequests = computed(
    () => result.value?.activeUser?.workspaceJoinRequests
  )

  const discoverableWorkspacesAndJoinRequests = computed(() => {
    const joinRequests =
      workspaceJoinRequests.value?.items
        ?.filter((r) => r.status !== 'approved')
        ?.map((request) => ({
          ...request.workspace,
          requestStatus: request.status
        })) || []

    const discoverable =
      discoverableWorkspaces.value?.map((workspace) => ({
        ...workspace,
        requestStatus: null
      })) || []

    return [...joinRequests, ...discoverable]
  })

  const hasDiscoverableWorkspaces = computed(
    () => discoverableWorkspaces.value && discoverableWorkspaces.value?.length > 0
  )

  const hasDiscoverableJoinRequests = computed(
    () => workspaceJoinRequests.value && workspaceJoinRequests.value?.items.length > 0
  )

  const hasDiscoverableWorkspacesOrJoinRequests = computed(() => {
    const requests = discoverableWorkspacesAndJoinRequests.value
    return requests && requests.length > 0
  })

  const discoverableWorkspacesCount = computed(
    () => discoverableWorkspaces.value?.length || 0
  )

  const discoverableJoinRequestsCount = computed(
    () => workspaceJoinRequests.value?.items.length || 0
  )

  const discoverableWorkspacesAndJoinRequestsCount = computed(
    () => discoverableWorkspacesAndJoinRequests.value?.length || 0
  )

  const requestToJoinWorkspace = async (workspaceId: string, location: string) => {
    const activeUserId = activeUser.value?.id

    if (!activeUserId) return

    const result = await requestToJoin({
      input: { workspaceId }
    }).catch(convertThrowIntoFetchResult)

    if (result?.data) {
      await refetch()

      mixpanel.track('Workspace Join Request Sent', {
        workspaceId,
        location,
        // eslint-disable-next-line camelcase
        workspace_id: workspaceId
      })

      triggerNotification({
        title: 'Request sent',
        description: 'Your request to join the workspace has been sent.',
        type: ToastNotificationType.Success
      })
    } else {
      const errorMessage = getFirstErrorMessage(result?.errors)
      triggerNotification({
        title: 'Failed to send request',
        description: errorMessage,
        type: ToastNotificationType.Danger
      })
    }
  }

  const dismissDiscoverableWorkspace = async (workspaceId: string) => {
    const result = await dismissWorkspace({
      input: { workspaceId }
    }).catch(convertThrowIntoFetchResult)
    const cache = apollo.cache
    const activeUserId = activeUser.value?.id

    if (!activeUserId) return

    if (result?.data) {
      triggerNotification({
        title: 'Discoverable workspace dismissed',
        type: ToastNotificationType.Info
      })

      cache.modify({
        id: getCacheId('User', activeUserId),
        fields: {
          discoverableWorkspaces(existingRefs = [], { readField }) {
            return existingRefs.filter(
              (ref: CacheObjectReference<'LimitedWorkspace'>) => {
                const id = readField('id', ref)
                return id !== workspaceId
              }
            )
          }
        }
      })
    } else {
      const errorMessage = getFirstErrorMessage(result?.errors)
      triggerNotification({
        title: 'Failed to dismiss workspace',
        description: errorMessage,
        type: ToastNotificationType.Danger
      })
    }
  }

  return {
    hasDiscoverableWorkspaces,
    hasDiscoverableJoinRequests,
    hasDiscoverableWorkspacesOrJoinRequests,
    discoverableJoinRequestsCount,
    discoverableWorkspacesCount,
    discoverableWorkspacesAndJoinRequestsCount,
    discoverableWorkspaces,
    dismissDiscoverableWorkspace,
    workspaceJoinRequests,
    discoverableWorkspacesAndJoinRequests,
    requestToJoinWorkspace,
    loading
  }
}
