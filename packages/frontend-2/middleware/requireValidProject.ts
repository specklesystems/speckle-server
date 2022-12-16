import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { projectPageQuery } from '~~/lib/projects/graphql/queries'

/**
 * Used in project page to validate that project ID refers to a valid project and redirects to 404 if not
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const projectId = to.params.id as string

  const { $apollo } = useNuxtApp()
  const client = $apollo.default

  const { data, errors } = await client
    .query({
      query: projectPageQuery,
      variables: { id: projectId }
    })
    .catch(convertThrowIntoFetchResult)

  // If project succesfully resolved, move on
  if (data?.project?.id) return

  const isNotFound = (errors || []).find(
    (e) => e.extensions['code'] === 'NOT_FOUND_ERROR'
  )
  if (isNotFound) {
    return abortNavigation(
      createError({ statusCode: 404, message: 'Project not found' })
    )
  }

  const isForbidden = (errors || []).find((e) => e.extensions['code'] === 'FORBIDDEN')
  if (isForbidden) {
    return abortNavigation(
      createError({
        statusCode: 403,
        message: 'You do not have access to this project'
      })
    )
  }

  const errMsg = getFirstErrorMessage(errors)
  return abortNavigation(errMsg)
})
