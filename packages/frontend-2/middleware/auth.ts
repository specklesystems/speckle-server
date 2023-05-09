import { ApolloClient } from '@apollo/client/core'
import { activeUserQuery } from '~~/lib/auth/composables/activeUser'
import { usePostAuthRedirect } from '~~/lib/auth/composables/postAuthRedirect'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { loginRoute } from '~~/lib/common/helpers/route'

/**
 * Apply this to a page to prevent unauthenticated access
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const nuxt = useNuxtApp()
  const { $apollo } = nuxt
  const client = ($apollo as { default: ApolloClient<unknown> }).default
  const postAuthRedirect = usePostAuthRedirect()

  const { data } = await client
    .query({
      query: activeUserQuery
    })
    .catch(convertThrowIntoFetchResult)

  // Redirect home, if not logged in
  if (!data?.activeUser?.id) {
    if (process.server && nuxt.ssrContext?.event.node.req.method === 'OPTIONS') {
      // quickfix hack to prevent redirect in OPTIONS
      return
    }

    postAuthRedirect.set(to.fullPath)
    return navigateTo(loginRoute)
  }

  return undefined
})
