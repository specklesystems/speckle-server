import { ApolloClient } from '@apollo/client/core'
import { activeUserQuery } from '~~/lib/auth/composables/activeUser'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { homeRoute } from '~~/lib/common/helpers/route'

const exclusionList = ['authorize-app']

/**
 * Apply this to a page to prevent authenticated access
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { $apollo } = useNuxtApp()
  const client = ($apollo as { default: ApolloClient<unknown> }).default

  // Skipping this on some auth sub-pages
  const routeName = to.name
  if (routeName && exclusionList.includes(routeName.toString())) return undefined

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
