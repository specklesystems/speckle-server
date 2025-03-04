import { activeUserWorkspaceExistenceCheckQuery } from '~/lib/auth/graphql/queries'
import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { workspaceCreateRoute } from '~~/lib/common/helpers/route'

/**
 * Redirect user to /workspaces/create, if they have no discoverable workspaces
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const isWorkspacesEnabled = useIsWorkspacesEnabled()

  if (!isWorkspacesEnabled.value) return

  const client = useApolloClientFromNuxt()
  const { data } = await client
    .query({
      query: activeUserWorkspaceExistenceCheckQuery
    })
    .catch(convertThrowIntoFetchResult)

  const hasDiscoverableWorkspaces =
    (data?.activeUser?.discoverableWorkspaces?.length ?? 0) > 0 ||
    (data?.activeUser?.workspaceJoinRequests?.totalCount ?? 0) > 0

  const isGoingToCreateWorkspace = to.path === workspaceCreateRoute()

  if (!hasDiscoverableWorkspaces && !isGoingToCreateWorkspace) {
    return navigateTo(workspaceCreateRoute())
  }
})
