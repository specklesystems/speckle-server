import { activeUserQuery } from '~~/lib/auth/composables/activeUser'
import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'

export default defineNuxtRouteMiddleware(async (to) => {
  const client = useApolloClientFromNuxt()
  const { data } = await client
    .query({
      query: activeUserQuery
    })
    .catch(convertThrowIntoFetchResult)

  // Ignore if not logged in
  if (!data?.activeUser?.id) return

  const bypassPaths = ['/verify-email', '/logout']
  if (bypassPaths.includes(to.path)) return

  if (!data.activeUser.verified) {
    return navigateTo('/verify-email')
  }
})
