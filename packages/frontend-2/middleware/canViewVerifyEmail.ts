import { activeUserQuery } from '~/lib/auth/composables/activeUser'
import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { homeRoute } from '~~/lib/common/helpers/route'

/**
 * Apply this to a page to prevent access to the verify email page when user has already verified all emails
 */
export default defineNuxtRouteMiddleware(async () => {
  const client = useApolloClientFromNuxt()
  const { data } = await client
    .query({
      query: activeUserQuery
    })
    .catch(convertThrowIntoFetchResult)

  if (!data?.activeUser?.id) return

  // If ALL emails are verified (primary and secondary), redirect away from verify page
  const allEmailsVerified =
    data.activeUser.verified && data.activeUser.emails.every((email) => email.verified)

  if (allEmailsVerified) {
    return navigateTo(homeRoute)
  }

  return undefined
})
