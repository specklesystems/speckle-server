import { activeUserQuery } from '~~/lib/auth/composables/activeUser'
import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { workspaceCreateRoute, workspaceJoinRoute } from '~~/lib/common/helpers/route'

/**
 * Redirect user to /workspaces/join or /workspaces/create, if they have no workspaces
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const isOnboardingForced = useIsOnboardingForced()
  const isWorkspaceNewPlansEnabled = useWorkspaceNewPlansEnabled()
  const isForceWorkspaceMembershipEnabled = useIsForceWorkspaceMembershipEnabled()

  const isAuthPage = to.path.startsWith('/authn/')

  if (isAuthPage) return
  if (!isWorkspaceNewPlansEnabled.value) return
  if (!isForceWorkspaceMembershipEnabled.value) return

  const client = useApolloClientFromNuxt()
  const { data } = await client
    .query({
      query: activeUserQuery,
      fetchPolicy: 'network-only'
    })
    .catch(convertThrowIntoFetchResult)

  // Ignore if not logged in
  if (!data?.activeUser?.id) return

  // Ignore if user has not verified their email yet
  if (!data?.activeUser?.verified) return

  // Ignore if user has not completed onboarding yet
  if (isOnboardingForced.value && !data?.activeUser?.isOnboardingFinished) return

  const isMemberOfWorkspace = data?.activeUser?.workspaces?.totalCount > 0
  const hasDiscoverableWorkspaces =
    (data?.activeUser?.discoverableWorkspaces?.length ?? 0) > 0 ||
    (data?.activeUser?.workspaceJoinRequests?.items?.length ?? 0) > 0

  const isGoingToJoinWorkspace = to.path === workspaceJoinRoute
  const isGoingToCreateWorkspace = to.path === workspaceCreateRoute()

  if (!isMemberOfWorkspace) {
    if (
      hasDiscoverableWorkspaces &&
      !isGoingToJoinWorkspace &&
      !isGoingToCreateWorkspace
    ) {
      return navigateTo(workspaceJoinRoute)
    }
    if (!hasDiscoverableWorkspaces && !isGoingToCreateWorkspace) {
      return navigateTo(workspaceCreateRoute())
    }
  }
})
