import type { Optional } from '@speckle/shared'
import { useApolloClientFromNuxt } from '~/lib/common/composables/graphql'
import {
  convertThrowIntoFetchResult,
  errorsToAuthResult
} from '~/lib/common/helpers/graphql'
import { dashboardAccessCheckQuery } from '~/lib/dashboards/graphql/queries'

/**
 * Used in dashboard page to validate that dashboard ID refers to a valid dashboard and redirects to 404 if not
 */
export default defineParallelizedNuxtRouteMiddleware(async (to, _from) => {
  const dashboardId = to.params.id as string

  // Check if dashboard token is present in URL
  const dashboardToken = to.query.dashboardToken as Optional<string>

  // Skip middleware validation for dashboard tokens - let the auth system handle them
  if (dashboardToken) {
    return
  }

  const client = useApolloClientFromNuxt()

  const { data, errors } = await client
    .query({
      query: dashboardAccessCheckQuery,
      variables: { id: dashboardId },
      context: {
        skipLoggingErrors: true
      }
    })
    .catch(convertThrowIntoFetchResult)

  if (!data?.dashboard) {
    const authResult = errorsToAuthResult({ errors })

    switch (authResult.code) {
      case 'FORBIDDEN':
        return abortNavigation(
          createError({
            statusCode: 403,
            message: authResult.message
          })
        )

      default:
        return abortNavigation(
          createError({
            statusCode: 500,
            message: authResult.message
          })
        )
    }
  }
})
