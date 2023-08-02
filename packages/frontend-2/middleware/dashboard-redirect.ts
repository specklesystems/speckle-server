import { activeUserQuery } from '~~/lib/auth/composables/activeUser'
import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { loginRoute } from '~~/lib/common/helpers/route'

/**
 * Redirect unauthenticated users to the login page
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const client = useApolloClientFromNuxt()
  const nuxt = useNuxtApp()

  const { data } = await client
    .query({
      query: activeUserQuery
    })
    .catch(convertThrowIntoFetchResult)

  if (!data?.activeUser?.id) {
    if (process.server && nuxt.ssrContext?.event.node.req.method === 'OPTIONS') {
      // quickfix hack to prevent redirect in OPTIONS
      return
    }
    return navigateTo({ path: loginRoute, query: to.query })
  }
})
