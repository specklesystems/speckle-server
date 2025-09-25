// import type { Optional } from '@speckle/shared'
import { useApolloClientFromNuxt } from '~/lib/common/composables/graphql'
import {
  convertThrowIntoFetchResult,
  errorsToAuthResult
} from '~/lib/common/helpers/graphql'
import { presentationAccessCheckQuery } from '~/lib/presentations/graphql/queries'

/**
 * Used in presentation page to validate that presentation ID refers to a valid presentation and redirects to 404 if not
 */
export default defineParallelizedNuxtRouteMiddleware(async (to, _from) => {
  const savedViewGroupId = to.params.presentationId as string
  const projectId = to.params.id as string

  // Check if token is present in URL
  // const token = to.query.presentationToken as Optional<string>

  // Skip middleware validation for tokens - let the auth system handle them
  // if (token) {
  //   return
  // }

  const client = useApolloClientFromNuxt()

  const { data, errors } = await client
    .query({
      query: presentationAccessCheckQuery,
      variables: { savedViewGroupId, projectId },
      context: {
        skipLoggingErrors: true
      }
    })
    .catch(convertThrowIntoFetchResult)

  if (!data?.project?.savedViewGroup) {
    const authResult = errorsToAuthResult({ errors })

    switch (authResult.code) {
      case 'FORBIDDEN':
        return abortNavigation(
          createError({
            statusCode: 403,
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
})
