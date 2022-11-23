import { activeUserQuery } from '~~/lib/auth/composables/activeUser'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { HomeRoute, OnboardingRoute } from '~~/lib/common/helpers/route'

/**
 * Redirect user to /onboarding, if they haven't done it yet
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { $apollo } = useNuxtApp()
  const client = $apollo.default

  // Skip if going to onboarding2 (test)
  if (to.path === '/onboarding2') return

  const { data } = await client
    .query({
      query: activeUserQuery
    })
    .catch(convertThrowIntoFetchResult)

  // Ignore if not logged in
  if (!data?.activeUser?.id) return

  const isOnboardingFinished = data.activeUser.isOnboardingFinished
  const isGoingToOnboarding = to.path === OnboardingRoute

  if (!isOnboardingFinished && !isGoingToOnboarding) {
    return navigateTo(OnboardingRoute)
  } else if (isOnboardingFinished && isGoingToOnboarding) {
    return navigateTo(HomeRoute)
  }
})
