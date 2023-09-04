import { activeUserQuery } from '~~/lib/auth/composables/activeUser'
import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { Roles } from '@speckle/shared'

/**
 * Apply this to a page to prevent access by non-admin users
 */
export default defineNuxtRouteMiddleware(async () => {
  const client = useApolloClientFromNuxt()

  const { data } = await client
    .query({
      query: activeUserQuery
    })
    .catch(convertThrowIntoFetchResult)

  // If user is not an Admin, show 403 message.
  if (data?.activeUser?.role !== Roles.Server.Admin) {
    return abortNavigation(
      createError({
        statusCode: 403,
        message: 'You do not have access to this page'
      })
    )
  }
  return undefined
})
