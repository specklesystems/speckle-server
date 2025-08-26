import type { Optional } from '@speckle/shared'

import { useApolloClientFromNuxt } from '~/lib/common/composables/graphql'
import {
  convertThrowIntoFetchResult,
  errorsToAuthResult
} from '~/lib/common/helpers/graphql'
import { projectAccessCheckQuery } from '~/lib/projects/graphql/queries'
import { WorkspaceSsoErrorCodes } from '~/lib/workspaces/helpers/types'
import { useSetActiveWorkspace } from '~/lib/user/composables/activeWorkspace'
import { useMiddlewareQueryFetchPolicy } from '~/lib/core/composables/navigation'

/**
 * Used in project page to validate that project ID refers to a valid project and redirects to 404 if not
 */
export default defineParallelizedNuxtRouteMiddleware(async (to, from) => {
  const projectId = to.params.id as string

  // Check if embed token is present in URL
  const embedToken = to.query.embedToken as Optional<string>

  // Skip middleware validation for embed tokens - let the auth system handle them
  if (embedToken) {
    return
  }

  const client = useApolloClientFromNuxt()
  const { setActiveWorkspace } = useSetActiveWorkspace()
  const { isLoggedIn } = useActiveUser()
  const isWorkspacesEnabled = useIsWorkspacesEnabled()
  const fetchPolicy = useMiddlewareQueryFetchPolicy()

  const { data, errors } = await client
    .query({
      query: projectAccessCheckQuery,
      variables: { id: projectId },
      context: {
        skipLoggingErrors: true
      },
      fetchPolicy: fetchPolicy(to, from)
    })
    .catch(convertThrowIntoFetchResult)

  // we may not even get to the authResult because of project() resolver errors, hence the mapping
  // from errors to authResult
  const authResult = data?.project.permissions.canRead || errorsToAuthResult({ errors })
  if (!authResult.authorized) {
    switch (authResult.code) {
      case WorkspaceSsoErrorCodes.SESSION_MISSING_OR_EXPIRED: {
        // Redirect to the SSO error page
        const payload = authResult.payload as Optional<{
          workspaceSlug: string
        }>
        const workspaceSlug = payload?.workspaceSlug
        if (workspaceSlug) {
          return navigateTo(`/workspaces/${workspaceSlug}/sso/session-error`)
        }
      }
      // eslint-disable-next-line no-fallthrough
      case 'FORBIDDEN':
        return abortNavigation(
          createError({
            statusCode: 403,
            message: authResult.message
          })
        )
      case 'STREAM_NOT_FOUND':
        return abortNavigation(
          createError({
            statusCode: 404,
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

  if (
    isLoggedIn.value &&
    isWorkspacesEnabled.value &&
    data?.activeUser?.activeWorkspace?.id !== data?.project.workspaceId
  ) {
    await setActiveWorkspace({ id: data?.project.workspaceId })
  }
})
