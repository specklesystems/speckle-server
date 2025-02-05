import { activeUserQuery } from '~~/lib/auth/composables/activeUser'
import { usePostAuthRedirect } from '~~/lib/auth/composables/postAuthRedirect'
import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { loginRoute } from '~~/lib/common/helpers/route'

/**
 * Apply this to a page to prevent unauthenticated access
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const nuxt = useNuxtApp()
  const client = useApolloClientFromNuxt()
  const postAuthRedirect = usePostAuthRedirect({ route: to })

  const isAccessCodeReq = !!to.query?.access_code
  const isBasicHomepage = to.path === '/' && !Object.keys(to.query).length
  const savePostAuthRedirect = !isAccessCodeReq && !isBasicHomepage

  const { data } = await client
    .query({
      query: activeUserQuery
    })
    .catch(convertThrowIntoFetchResult)

  // Redirect home, if not logged in
  if (!data?.activeUser?.id) {
    if (import.meta.server && nuxt.ssrContext?.event.node.req.method === 'OPTIONS') {
      // quickfix hack to prevent redirect in OPTIONS
      return
    }

    // Save current route for post-auth redirect and just go to login page
    if (savePostAuthRedirect) {
      postAuthRedirect.set(to.fullPath)
      return navigateTo(loginRoute)
    } else {
      // Go to login page and forward all query params there too (this is probably the
      // access code retrieval fetch request)
      return navigateTo({ path: loginRoute, query: to.query })
    }
  }
})
