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
  const workspaceId = to.params.id as string

  const client = useApolloClientFromNuxt()

  const { data, errors } = await client
    .query({
      query: workspaceAccessCheckQuery,
      variables: { id: workspaceId },
      context: {
        skipLoggingErrors: true
      }
    })
    .catch(convertThrowIntoFetchResult)

  if (data?.workspace?.id) return

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
