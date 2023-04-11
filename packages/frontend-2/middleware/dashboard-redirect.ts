import { ApolloClient } from '@apollo/client/core'
import { activeUserQuery } from '~~/lib/auth/composables/activeUser'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { loginRoute } from '~~/lib/common/helpers/route'

/**
 * Redirect unauthenticated users to the login page
 */
export default defineNuxtRouteMiddleware(async () => {
  const { $apollo } = useNuxtApp()
  const client = ($apollo as { default: ApolloClient<unknown> }).default

  const { data } = await client
    .query({
      query: activeUserQuery
    })
    .catch(convertThrowIntoFetchResult)

  if (!data?.activeUser?.id) return navigateTo(loginRoute)
})
