import { activeUserQuery } from '~~/lib/auth/composables/activeUser'
import { usePostAuthRedirect } from '~~/lib/auth/composables/postAuthRedirect'
import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { projectRoute } from '~~/lib/common/helpers/route'

/**
 * Apply this to a page to prevent unauthenticated access to settings
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const nuxt = useNuxtApp()
  const client = useApolloClientFromNuxt()
  const postAuthRedirect = usePostAuthRedirect({ route: to })

  const { data } = await client
    .query({
      query: activeUserQuery
    })
    .catch(convertThrowIntoFetchResult)

  // Redirect to project route if not logged in
  if (!data?.activeUser?.id) {
    if (process.server && nuxt.ssrContext?.event.node.req.method === 'OPTIONS') {
      // quickfix hack to prevent redirect in OPTIONS
      return
    }

    const projectId = to.params.id as string
    postAuthRedirect.set(to.fullPath)
    return navigateTo(projectRoute(projectId))
  }

  return undefined
})
