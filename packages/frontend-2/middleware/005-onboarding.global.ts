import { activeUserQuery } from '~~/lib/auth/composables/activeUser'
import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import {
  homeRoute,
  onboardingRoute,
  onboardingJoinRoute
} from '~~/lib/common/helpers/route'
import { useWorkspaceNewPlansEnabled } from '~/composables/globals'

/**
 * Redirect user to /onboarding, if they haven't done it yet
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const isAuthPage = to.path.startsWith('/authn/')
  if (isAuthPage) return

  const client = useApolloClientFromNuxt()
  const { data } = await client
    .query({
      query: activeUserQuery
    })
    .catch(convertThrowIntoFetchResult)

  // Ignore if not logged in
  if (!data?.activeUser?.id) return

  // Ignore if user has not verified their email yet
  if (!data?.activeUser?.verified) return

  // FF-CLEANUP: Remove when workspaces plans released
  // Determine which onboarding route to use based on feature flag
  const isWorkspaceNewPlansEnabled = useWorkspaceNewPlansEnabled()
  const actualOnboardingRoute = isWorkspaceNewPlansEnabled.value
    ? onboardingRoute
    : onboardingJoinRoute

  const isOnboardingFinished = data?.activeUser?.isOnboardingFinished
  const isGoingToOnboarding = to.path === actualOnboardingRoute
  const shouldRedirectToOnboarding =
    !isOnboardingFinished &&
    !isGoingToOnboarding &&
    to.query['skiponboarding'] !== 'true'

  if (shouldRedirectToOnboarding) {
    return navigateTo(actualOnboardingRoute)
  }

  if (isGoingToOnboarding && isOnboardingFinished && to.query['force'] !== 'true') {
    return navigateTo(homeRoute)
  }
})
