import { homeRoute, verifyEmailRoute } from '~/lib/common/helpers/route'
import { mainServerInfoDataQuery } from '~/lib/core/composables/server'
import { activeUserQuery } from '~~/lib/auth/composables/activeUser'
import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'

/**
 * Redirect user to /verify-email, if they haven't done it yet
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const isAuthPage = to.path.startsWith('/authn/')
  if (isAuthPage) return

  const client = useApolloClientFromNuxt()
  const { data: emailData } = await client
    .query({
      query: mainServerInfoDataQuery
    })
    .catch(convertThrowIntoFetchResult)

  if (!emailData?.serverInfo.configuration.isEmailEnabled) return

  const { data } = await client
    .query({
      query: activeUserQuery
    })
    .catch(convertThrowIntoFetchResult)

  if (!data?.activeUser?.id) return

  const isVerifyEmailPage = to.path === verifyEmailRoute

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
