import { ProjectVisibility } from '~/lib/common/generated/gql/graphql'
import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { projectAccessCheckQuery } from '~~/lib/projects/graphql/queries'

/**
 * Used in project page to validate that project ID refers to a valid project and redirects to 404 if not
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const projectId = to.params.id as string

  const client = useApolloClientFromNuxt()

  const { data, errors } = await client
    .query({
      query: projectAccessCheckQuery,
      variables: { id: projectId },
      context: {
        skipLoggingErrors: true
      }
    })
    .catch(convertThrowIntoFetchResult)

  // Check for SSO session error first
  const ssoSessionError = (errors || []).find(
    (e) => e.extensions?.['code'] === 'SSO_SESSION_MISSING_OR_EXPIRED_ERROR'
  )

  // If we have an SSO error, the message contains the workspace slug
  if (ssoSessionError) {
    const workspaceSlug = ssoSessionError.message
    return navigateTo(`/workspaces/${workspaceSlug}/sso/session-error`)
  }

  // If project is public, allow access regardless of SSO
  if (data?.project?.visibility === ProjectVisibility.Public) {
    return
  }

  // If project successfully resolved and isn't public, continue with normal flow
  if (data?.project?.id) {
    return
  }

  const isForbidden = (errors || []).find((e) => e.extensions?.['code'] === 'FORBIDDEN')
  const isNotFound = (errors || []).find(
    (e) => e.extensions?.['code'] === 'STREAM_NOT_FOUND'
  )

  if (isNotFound) {
    return abortNavigation(
      createError({ statusCode: 404, message: 'Project not found' })
    )
  }

  if (isForbidden) {
    return abortNavigation(
      createError({
        statusCode: 403,
        message: 'You do not have access to this project'
      })
    )
  }

  if (errors?.length) {
    return abortNavigation(
      createError({
        statusCode: 500,
        message: getFirstErrorMessage(errors) || 'An unexpected error occurred'
      })
    )
  }
})
