import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { workspaceAccessCheckQuery } from '~~/lib/workspaces/graphql/queries'

/**
 * Used to validate that the workspace ID refers to a valid workspace and redirects to 404 if not
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const workspaceSlug = to.params.slug as string

  const client = useApolloClientFromNuxt()

  const { data, errors } = await client
    .query({
      query: workspaceAccessCheckQuery,
      variables: { slug: workspaceSlug },
      context: {
        skipLoggingErrors: true
      },
      fetchPolicy: 'network-only'
    })
    .catch(convertThrowIntoFetchResult)

  if (data?.workspaceBySlug.id) return

  const isForbidden = (errors || []).find((e) => e.extensions['code'] === 'FORBIDDEN')
  const isNotFound = (errors || []).find(
    (e) => e.extensions['code'] === 'WORKSPACE_NOT_FOUND_ERROR'
  )
  if (isForbidden) {
    return abortNavigation(
      createError({
        statusCode: 403,
        message: 'You do not have access to this workspace'
      })
    )
  }

  if (isNotFound) {
    return abortNavigation(
      createError({ statusCode: 404, message: 'Workspace not found' })
    )
  }

  if (errors?.length) {
    // Check for SSO session error
    const ssoSessionError = errors.find(
      (e) => e.extensions?.['code'] === 'SSO_SESSION_MISSING_OR_EXPIRED_ERROR'
    )

    if (ssoSessionError) {
      // Redirect to the SSO error page
      return navigateTo(`/workspaces/${workspaceSlug}/sso/session-error`)
    }

    const firstErrorWithCode = errors.find((e) => e.extensions?.['code'])
    if (firstErrorWithCode) {
      const errorCode = firstErrorWithCode.extensions['code']
      return abortNavigation(
        createError({
          statusCode: 401,
          message: `Error: ${errorCode}. Please check your access or contact support.`
        })
      )
    }

    const errMsg = getFirstErrorMessage(errors) || 'An unexpected error occurred.'
    return abortNavigation(
      createError({
        statusCode: 500,
        message: errMsg
      })
    )
  }
})
