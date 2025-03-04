import { activeUserWorkspaceExistenceCheckQuery } from '~/lib/auth/graphql/queries'
import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { workspaceCreateRoute, workspaceJoinRoute } from '~~/lib/common/helpers/route'

/**
 * Redirect user to /workspaces/join or /workspaces/create, if they have no workspaces
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const isAuthPage = to.path.startsWith('/authn/')
  if (isAuthPage) return

  const isOnboardingForced = useIsOnboardingForced()
  const isWorkspaceNewPlansEnabled = useWorkspaceNewPlansEnabled()
  const isWorkspacesEnabled = useIsWorkspacesEnabled()

  if (!isWorkspacesEnabled.value) return
  if (!isWorkspaceNewPlansEnabled.value) return

  const client = useApolloClientFromNuxt()
  const { data } = await client
    .query({
      query: activeUserWorkspaceExistenceCheckQuery
    })
    .catch(convertThrowIntoFetchResult)

  // Ignore if not logged in
  if (!data?.activeUser?.id) return

  // Ignore if user has not verified their email yet
  if (!data?.activeUser?.verified) return

  // Ignore if user has not completed onboarding yet
  if (isOnboardingForced.value && !data?.activeUser?.isOnboardingFinished) return

  const isMemberOfWorkspace = (data?.activeUser?.workspaces?.totalCount ?? 0) > 0
  const hasLegacyProjects = (data?.activeUser?.versions?.totalCount ?? 0) > 0
  const hasDiscoverableWorkspaces =
    (data?.activeUser?.discoverableWorkspaces?.length ?? 0) > 0 ||
    (data?.activeUser?.workspaceJoinRequests?.totalCount ?? 0) > 0

  const isGoingToJoinWorkspace = to.path === workspaceJoinRoute
  const isGoingToCreateWorkspace = to.path === workspaceCreateRoute()

  if (!isMemberOfWorkspace && !hasLegacyProjects) {
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
