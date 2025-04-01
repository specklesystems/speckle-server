import { throwUncoveredError } from '@speckle/shared'
import {
  ProjectNoAccessError,
  ProjectNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  WorkspaceNoAccessError,
  WorkspaceSsoSessionNoAccessError
} from '@speckle/shared/authz'
import { useAuthPolicies } from '~/lib/auth/composables/authPolicies'
import { ActiveUserId } from '~/lib/auth/helpers/authPolicies'
import { loginRoute } from '~/lib/common/helpers/route'

/**
 * Used in project page to validate that project ID refers to a valid project and redirects to 404 if not
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const projectId = to.params.id as string
  const authPolicies = useAuthPolicies()
  const canAccess = await authPolicies.noCache().project.canRead({
    projectId,
    userId: ActiveUserId
  })
  if (canAccess.isErr) {
    switch (canAccess.error.code) {
      case WorkspaceSsoSessionNoAccessError.code: {
        // Redirect to the SSO error page
        const workspaceSlug = canAccess.error.payload.workspaceSlug
        return navigateTo(`/workspaces/${workspaceSlug}/sso/session-error`)
      }
      case ProjectNotFoundError.code: {
        return abortNavigation(
          createError({ statusCode: 404, message: 'Project not found' })
        )
      }
      case WorkspaceNoAccessError.code:
      case ProjectNoAccessError.code: {
        return abortNavigation(
          createError({
            statusCode: 403,
            message: 'You do not have access to this project'
          })
        )
      }
      case ServerNoAccessError.code:
      case ServerNoSessionError.code:
        return navigateTo(loginRoute)
      default: {
        throwUncoveredError(canAccess.error)
      }
    }
  }
})
