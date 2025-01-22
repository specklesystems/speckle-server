import { activeUserQuery } from '~/lib/auth/composables/activeUser'
import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { homeRoute } from '~~/lib/common/helpers/route'

/**
 * Apply this to a page to prevent access to the verify email page when user has already verified
 */
export default defineNuxtRouteMiddleware(async () => {
  const client = useApolloClientFromNuxt()
  const { data } = await client
    .query({
      query: activeUserQuery
    })
    .catch(convertThrowIntoFetchResult)

  if (!data?.activeUser?.id) return

  // Check if the user has verified their email
  const hasVerifiedEmail = data?.activeUser.verified

  if (hasVerifiedEmail) {
    return navigateTo(homeRoute)
  }

  return undefined
})
