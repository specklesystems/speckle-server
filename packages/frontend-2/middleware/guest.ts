import { ApolloClient } from '@apollo/client/core'
import { activeUserQuery } from '~~/lib/auth/composables/activeUser'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { homeRoute } from '~~/lib/common/helpers/route'

const exclusionList = ['authorize-app']

/**
 * Apply this to a page to prevent authenticated access
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const nuxt = useNuxtApp()
  const { $apollo } = nuxt
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
    if (process.server && nuxt.ssrContext?.event.node.req.method === 'OPTIONS') {
      // quickfix hack to prevent redirect in OPTIONS
      return
    }
    return navigateTo(homeRoute)
  }

  return undefined
})
