import { homeRoute, verifyEmailRoute } from '~/lib/common/helpers/route'
import { activeUserQuery } from '~~/lib/auth/composables/activeUser'
import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'

/**
 * Redirect user to /verify-email, if they haven't done it yet
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const isEmailVerificationForced = useIsEmailVerificationForced()

  const client = useApolloClientFromNuxt()
  const { data } = await client
    .query({
      query: activeUserQuery
    })
    .catch(convertThrowIntoFetchResult)

  if (!data?.activeUser?.id) return

  const isAuthPage = to.path.startsWith('/authn/')
  const isVerifyEmailPage = to.path === verifyEmailRoute

  // Skip if not forced and not on verify email page
  if (!isEmailVerificationForced.value && !isVerifyEmailPage) return
  if (isAuthPage) return

  const hasUnverifiedEmails = data.activeUser.emails.some((email) => !email.verified)

  if (hasUnverifiedEmails) {
    // Redirect to verify email if not already there
    if (!isVerifyEmailPage) {
      return navigateTo(verifyEmailRoute)
    }
  } else {
    if (isVerifyEmailPage) {
      return navigateTo(homeRoute)
    }
  }
})
