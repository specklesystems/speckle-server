import { useWorkspaceSso } from '~/lib/workspaces/composables/management'
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
  const logger = useLogger()

  // Skip access check if:
  // 1. We're in SSO flow with access_code
  // 2. We have an invite token
  if (to.query.access_code || to.query.token) {
    return
  }

  const workspaceSlug = to.params.slug as string

  const { hasSsoEnabled, needsSsoLogin, error } = useWorkspaceSso({
    workspaceSlug
  })

  logger.debug('SSO Middleware - status:', {
    workspaceSlug,
    hasSsoEnabled: hasSsoEnabled.value,
    needsSsoLogin: needsSsoLogin.value,
    error: error.value
  })

  logger.debug('SSO Middleware - checking workspace:', workspaceSlug)

  const client = useApolloClientFromNuxt()

  const { data, errors } = await client
    .query({
      query: workspaceAccessCheckQuery,
      variables: { slug: workspaceSlug },
      context: {
        skipLoggingErrors: true
      }
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
    const errMsg = getFirstErrorMessage(errors)
    return abortNavigation(
      createError({
        statusCode: 500,
        message: errMsg
      })
    )
  }
})
