import { isLoggedInQuery } from '~~/lib/auth/graphql/queries'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'

/**
 * Apply this to a page to prevent unauthenticated access
 */
export default defineNuxtRouteMiddleware(async () => {
  const { $apollo } = useNuxtApp()
  const client = $apollo.default

  const { data } = await client
    .query({
      query: isLoggedInQuery
    })
    .catch(convertThrowIntoFetchResult)

  // Redirect home, if not logged in
  if (!data?.activeUser?.id) {
    return navigateTo('/')
  }
})
