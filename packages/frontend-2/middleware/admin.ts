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

  // If not logged in, redirect to login. If logged in but not an admin, redirect home.
  if (data?.activeUser?.role !== Roles.Server.Admin) {
    return abortNavigation(
      createError({
        statusCode: 403,
        message: 'You do not have access to this project'
      })
    )
  }
  return undefined
})
