import { useQuery, useMutation, useApolloClient } from '@vue/apollo-composable'
import {
  discoverableWorkspacesQuery,
  discoverableWorkspacesRequestsQuery
} from '../graphql/queries'
import {
  dashboardDismissDiscoverableWorkspaceMutation,
  dashboardRequestToJoinWorkspaceMutation
} from '~/lib/dashboard/graphql/mutations'
import { graphql } from '~/lib/common/generated/gql'
import { useMixpanel } from '~/lib/core/composables/mp'
import type { CacheObjectReference } from '~~/lib/common/helpers/graphql'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage,
  getCacheId
} from '~~/lib/common/helpers/graphql'

graphql(`
  fragment DiscoverableList_Discoverable on User {
    discoverableWorkspaces {
      id
      name
      logo
      description
      slug
      team {
        totalCount
        items {
          avatar
        }
      }
    }
  }
`)

graphql(`
  fragment DiscoverableList_Requests on User {
    workspaceJoinRequests {
      items {
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
              avatar
            }
          }
        }
      }
    }
  }
`)

export const useDiscoverableWorkspaces = () => {
  const isWorkspacesEnabled = useIsWorkspacesEnabled()

  const { result: discoverableResult, loading: discoverableLoading } = useQuery(
    discoverableWorkspacesQuery,
    undefined,
    { enabled: isWorkspacesEnabled }
  )
  const { result: requestsResult, loading: joinRequestsLoading } = useQuery(
    discoverableWorkspacesRequestsQuery,
    undefined,
    {
      enabled: isWorkspacesEnabled
    }
  )

  const { mutate: requestToJoin } = useMutation(dashboardRequestToJoinWorkspaceMutation)
  const { mutate: dismissWorkspace } = useMutation(
    dashboardDismissDiscoverableWorkspaceMutation
  )

  const { activeUser } = useActiveUser()
  const mixpanel = useMixpanel()
  const { triggerNotification } = useGlobalToast()
  const apollo = useApolloClient().client

  const discoverableWorkspaces = computed(
    () => discoverableResult.value?.activeUser?.discoverableWorkspaces
  )

  const workspaceJoinRequests = computed(
    () => requestsResult.value?.activeUser?.workspaceJoinRequests
  )

  const discoverableWorkspacesAndJoinRequests = computed(() => {
    const joinRequests =
      workspaceJoinRequests.value?.items?.map((request) => ({
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
    () => discoverableWorkspacesCount.value + discoverableJoinRequestsCount.value
  )

  const requestToJoinWorkspace = async (workspaceId: string) => {
    const cache = apollo.cache
    const activeUserId = activeUser.value?.id

    if (!activeUserId) return

    const result = await requestToJoin({
      input: { workspaceId }
    }).catch(convertThrowIntoFetchResult)

    if (result?.data) {
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

      mixpanel.track('Workspace Join Request Sent', {
        workspaceId,
        location: 'onboarding',
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

  const loading = computed(() => {
    return discoverableLoading.value || joinRequestsLoading.value
  })

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
