import { activeUserQuery } from '~~/lib/auth/composables/activeUser'
import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { workspaceCreateRoute, workspaceJoinRoute } from '~~/lib/common/helpers/route'

/**
 * Redirect user to /workspaces/create, if they haven't done it yet
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // const isOnboardingForced = useIsOnboardingForced()
  const isOnboardingForced = useIsOnboardingForced()

  const client = useApolloClientFromNuxt()
  const { data } = await client
    .query({
      query: activeUserQuery
    })
    .catch(convertThrowIntoFetchResult)

  // Ignore if not logged in
  if (!data?.activeUser?.id) return

  // Ignore if force workspace ff is false
  if (!isOnboardingForced.value) return

  // Ignore if user has not verified their email yet
  if (!data?.activeUser?.verified) return

  // Ignore if user has not completed onboarding yet
  if (!data?.activeUser?.isOnboardingFinished) return

  const isMemberOfWorkspace = data?.activeUser?.workspaces?.totalCount > 0
  const hasDiscoverableWorkspaces = data?.activeUser?.discoverableWorkspaces?.length > 0

  const isGoingToJoinWorkspace = to.path === workspaceJoinRoute
  const isGoingToCreateWorkspace = to.path === workspaceCreateRoute()

  if (!isMemberOfWorkspace && hasDiscoverableWorkspaces && !isGoingToJoinWorkspace) {
    return navigateTo(workspaceJoinRoute)
  }

  if (!isMemberOfWorkspace && !hasDiscoverableWorkspaces && !isGoingToCreateWorkspace) {
    return navigateTo(workspaceCreateRoute())
  }
})
