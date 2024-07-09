import { activeUserQuery } from '~~/lib/auth/composables/activeUser'
import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { homeRoute, onboardingRoute } from '~~/lib/common/helpers/route'

/**
 * Redirect user to /onboarding, if they haven't done it yet
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const client = useApolloClientFromNuxt()
  const { data } = await client
    .query({
      query: activeUserQuery
    })
    .catch(convertThrowIntoFetchResult)

  // Ignore if not logged in
  if (!data?.activeUser?.id) return

  const isOnboardingFinished = data?.activeUser?.isOnboardingFinished
  const isGoingToOnboarding = to.path === onboardingRoute
  const shouldRedirectToOnboarding =
    !isOnboardingFinished &&
    !isGoingToOnboarding &&
    to.query['skiponboarding'] !== 'true'

  if (shouldRedirectToOnboarding) {
    return navigateTo(onboardingRoute)
  }

  if (isGoingToOnboarding && isOnboardingFinished && to.query['force'] !== 'true') {
    return navigateTo(homeRoute)
  }
})
