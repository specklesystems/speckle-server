import { activeUserQuery } from '~~/lib/auth/composables/activeUser'
import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { workspaceCreateRoute } from '~~/lib/common/helpers/route'

/**
 * Redirect user to /workspaces/actions/create, if they have no discoverable workspaces
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const client = useApolloClientFromNuxt()
  const { data } = await client
    .query({
      query: activeUserQuery,
      fetchPolicy: 'network-only'
    })
    .catch(convertThrowIntoFetchResult)

  const hasDiscoverableWorkspaces =
    (data?.activeUser?.discoverableWorkspaces?.length ?? 0) > 0 ||
    (data?.activeUser?.workspaceJoinRequests?.items?.length ?? 0) > 0

  const isGoingToCreateWorkspace = to.path === workspaceCreateRoute()

  if (!hasDiscoverableWorkspaces && !isGoingToCreateWorkspace) {
    return navigateTo(workspaceCreateRoute())
  }
})
