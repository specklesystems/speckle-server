import { activeUserQuery } from '~~/lib/auth/composables/activeUser'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { homeRoute } from '~~/lib/common/helpers/route'

/**
 * Apply this to a page to prevent authenticated access
 */
export default defineNuxtRouteMiddleware(async () => {
  const { $apollo } = useNuxtApp()
  const client = $apollo.default

  const { data } = await client
    .query({
      query: activeUserQuery
    })
    .catch(convertThrowIntoFetchResult)

  // Redirect home, if not logged in
  if (data?.activeUser?.id) {
    return navigateTo(homeRoute)
  }

  return undefined
})
