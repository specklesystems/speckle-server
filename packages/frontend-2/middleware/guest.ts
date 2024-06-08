import { activeUserQuery } from '~~/lib/auth/composables/activeUser'
import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { homeRoute } from '~~/lib/common/helpers/route'

const exclusionList = ['authorize-app', 'reset-password']

/**
 * Apply this to a page to prevent authenticated access
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const nuxt = useNuxtApp()
  const client = useApolloClientFromNuxt()

  // Skipping this on some auth sub-pages
  const routeName = to.name
  if (routeName && exclusionList.includes(routeName.toString())) return undefined

  const { data } = await client
    .query({
      query: activeUserQuery
    })
    .catch(convertThrowIntoFetchResult)

  // Redirect home, if logged in
  if (data?.activeUser?.id) {
    if (import.meta.server && nuxt.ssrContext?.event.node.req.method === 'OPTIONS') {
      // quickfix hack to prevent redirect in OPTIONS
      return
    }
    return navigateTo(homeRoute)
  }

  return undefined
})
