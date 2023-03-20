import { ApolloClient } from '@apollo/client/core'
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

  const { $apollo } = useNuxtApp()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const client = $apollo.default as ApolloClient<unknown>

  const { data, errors } = await client
    .query({
      query: projectAccessCheckQuery,
      variables: { id: projectId }
    })
    .catch(convertThrowIntoFetchResult)

  // If project succesfully resolved, move on
  if (data?.project?.id) return

  const isForbidden = (errors || []).find((e) => e.extensions['code'] === 'FORBIDDEN')
  if (isForbidden) {
    return abortNavigation(
      createError({
        statusCode: 403,
        message: 'You do not have access to this project'
      })
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

  if (!data?.project) {
    return abortNavigation(
      createError({ statusCode: 404, message: 'Project not found' })
    )
  }
})
