import { activeUserQuery } from '~~/lib/auth/composables/activeUser'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { homeRoute, onboardingRoute } from '~~/lib/common/helpers/route'

/**
 * Redirect user to /onboarding, if they haven't done it yet
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { $apollo } = useNuxtApp()
  const client = $apollo.default

  const { data } = await client
    .query({
      query: activeUserQuery
    })
    .catch(convertThrowIntoFetchResult)

  // Ignore if not logged in
  if (!data?.activeUser?.id) return

  const isOnboardingFinished = data.activeUser.isOnboardingFinished
  const isGoingToOnboarding = to.path === onboardingRoute

  if (!isOnboardingFinished && !isGoingToOnboarding) {
    return navigateTo(onboardingRoute)
  } else if (isOnboardingFinished && isGoingToOnboarding) {
    return navigateTo(homeRoute)
  }
})
