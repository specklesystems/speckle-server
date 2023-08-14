import { activeUserQuery } from '~~/lib/auth/composables/activeUser'
import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { homeRoute, loginRoute } from '~~/lib/common/helpers/route'

/**
 * Apply this to a page to prevent access by non-admin users
 */
export default defineNuxtRouteMiddleware(async () => {
  const client = useApolloClientFromNuxt()

  const { data } = await client
    .query({
      query: activeUserQuery
    })
    .catch(convertThrowIntoFetchResult)

  // If not logged in, redirect to login. If logged in but not an admin, redirect home.
  if (!data?.activeUser?.id) {
    return navigateTo(loginRoute)
  } else if (
    data?.activeUser?.role !== 'server:admin' &&
    data?.activeUser?.role !== 'client:admin'
  ) {
    return navigateTo(homeRoute)
  }

  return undefined
})
