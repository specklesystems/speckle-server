import { verifyEmailRoute } from '~/lib/common/helpers/route'
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

  const shouldSkipMiddleware =
    !isEmailVerificationForced.value || isAuthPage || isVerifyEmailPage

  if (shouldSkipMiddleware) return

  const hasUnverifiedEmails =
    !data.activeUser.verified || data.activeUser.emails.some((email) => !email.verified)

  if (hasUnverifiedEmails) {
    return navigateTo(verifyEmailRoute)
  }
})
