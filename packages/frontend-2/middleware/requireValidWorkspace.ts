import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { useSetActiveWorkspace } from '~/lib/user/composables/activeWorkspace'
import { buildWorkspaceAccessCheckQuery } from '~/lib/workspaces/helpers/middleware'
import { useMiddlewareQueryFetchPolicy } from '~/lib/core/composables/navigation'

/**
 * Used to validate that the workspace ID refers to a valid workspace and redirects to 404 if not
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  const workspaceSlug = to.params.slug as string

  const client = useApolloClientFromNuxt()
  const { setActiveWorkspace } = useSetActiveWorkspace()
  const { isLoggedIn } = useActiveUser()
  const fetchPolicy = useMiddlewareQueryFetchPolicy()

  const { data, errors } = await client
    .query(buildWorkspaceAccessCheckQuery(workspaceSlug, fetchPolicy(to, from)))
    .catch(convertThrowIntoFetchResult)

  if (
    data?.workspaceBySlug.id &&
    isLoggedIn.value &&
    data.workspaceBySlug?.id !== data.activeUser?.activeWorkspace?.id
  ) {
    await setActiveWorkspace({ slug: workspaceSlug })
  }

  const isForbidden = (errors || []).find((e) => e.extensions?.['code'] === 'FORBIDDEN')
  const isNotFound = (errors || []).find(
    (e) => e.extensions?.['code'] === 'WORKSPACE_NOT_FOUND_ERROR'
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
      const errorCode = firstErrorWithCode.extensions?.['code']
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
