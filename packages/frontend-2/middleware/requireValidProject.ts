import { ApolloClient } from '@apollo/client/core'
import { Optional } from '@speckle/shared'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { registerRoute } from '~~/lib/common/helpers/route'
import { projectAccessCheckQuery } from '~~/lib/projects/graphql/queries'

/**
 * Used in project page to validate that project ID refers to a valid project and redirects to 404 if not
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const projectId = to.params.id as string
  const inviteToken = to.query.token as Optional<string>

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
    if (inviteToken) {
      // Redirect to registration page for now
      return navigateTo({
        path: registerRoute,
        query: {
          token: inviteToken
        }
      })
    }

    return abortNavigation(
      createError({
        statusCode: 403,
        message: 'You do not have access to this project'
      })
    )
  }

  if (errors?.length) {
    const errMsg = getFirstErrorMessage(errors)
    return abortNavigation(errMsg)
  }

  if (!data?.project) {
    return abortNavigation(
      createError({ statusCode: 404, message: 'Project not found' })
    )
  }
})
