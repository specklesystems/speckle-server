import { useQuery, useMutation, useApolloClient } from '@vue/apollo-composable'
import {
  discoverableWorkspacesQuery,
  discoverableWorkspacesRequestsQuery
} from '../graphql/queries'
import { dashboardRequestToJoinWorkspaceMutation } from '~/lib/dashboard/graphql/mutations'
import { graphql } from '~/lib/common/generated/gql'
import { useMixpanel } from '~/lib/core/composables/mp'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
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
  const { result: discoverableResult } = useQuery(discoverableWorkspacesQuery)
  const { result: requestsResult, refetch } = useQuery(
    discoverableWorkspacesRequestsQuery
  )
  const { mutate: requestToJoin } = useMutation(dashboardRequestToJoinWorkspaceMutation)

  const mixpanel = useMixpanel()
  const { triggerNotification } = useGlobalToast()
  const apollo = useApolloClient().client

  const discoverableWorkspaces = computed(
    () => discoverableResult.value?.activeUser?.discoverableWorkspaces || null
  )

  const workspaceJoinRequests = computed(
    () => requestsResult.value?.activeUser?.workspaceJoinRequests || null
  )

  const hasDiscoverableWorkspaces = computed(
    () => discoverableWorkspaces.value !== null
  )

  const hasDiscoverableJoinRequests = computed(
    () => workspaceJoinRequests.value !== null
  )

  const hasDiscoverableWorkspacesOrJoinRequests = computed(() => {
    return hasDiscoverableJoinRequests.value || hasDiscoverableWorkspaces.value
  })

  const discoverableWorkspacesCount = computed(
    () => discoverableWorkspaces.value?.length || 0
  )

  const discoverableJoinRequestsCount = computed(() =>
    workspaceJoinRequests.value && 'items' in workspaceJoinRequests.value
      ? workspaceJoinRequests.value.items.length
      : 0
  )

  const discoverableWorkspacesAndJoinRequestsCount = computed(
    () => discoverableWorkspacesCount.value + discoverableJoinRequestsCount.value
  )

  const processRequest = async (accept: boolean, workspaceId: string) => {
    const cache = apollo.cache

    if (accept) {
      const result = await requestToJoin({
        input: { workspaceId }
      }).catch(convertThrowIntoFetchResult)

      if (result?.data) {
        cache.evict({
          id: getCacheId('LimitedWorkspace', workspaceId)
        })
        refetch()

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
  }

  const discoverableWorkspacesAndJoinRequests = computed(() => {
    const joinRequests = (
      workspaceJoinRequests.value ? workspaceJoinRequests.value.items : []
    ).map((request) => ({
      ...request.workspace,
      requestStatus: request.status
    }))

    const discoverable = (discoverableWorkspaces.value || []).map((workspace) => ({
      ...workspace,
      requestStatus: null
    }))

    return [...joinRequests, ...discoverable]
  })

  return {
    hasDiscoverableWorkspaces,
    hasDiscoverableJoinRequests,
    hasDiscoverableWorkspacesOrJoinRequests,
    discoverableJoinRequestsCount,
    discoverableWorkspacesCount,
    discoverableWorkspacesAndJoinRequestsCount,
    discoverableWorkspaces,
    workspaceJoinRequests,
    discoverableWorkspacesAndJoinRequests,
    processRequest
  }
}
