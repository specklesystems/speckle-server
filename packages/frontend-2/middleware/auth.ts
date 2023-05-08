import { ApolloClient } from '@apollo/client/core'
import { activeUserQuery } from '~~/lib/auth/composables/activeUser'
import { usePostAuthRedirect } from '~~/lib/auth/composables/postAuthRedirect'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { loginRoute } from '~~/lib/common/helpers/route'

/**
 * Apply this to a page to prevent unauthenticated access
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { $apollo } = useNuxtApp()
  const client = ($apollo as { default: ApolloClient<unknown> }).default
  const postAuthRedirect = usePostAuthRedirect()

  const { data } = await client
    .query({
      query: activeUserQuery
    })
    .catch(convertThrowIntoFetchResult)

  // Redirect home, if not logged in
  if (!data?.activeUser?.id) {
    postAuthRedirect.set(to.fullPath)
    return navigateTo(loginRoute)
  }

  return undefined
})
