import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { projectWebhookAccessCheckQuery } from '~~/lib/projects/graphql/queries'

/**
 * Used to validate that user has access to Webhooks
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const projectId = to.params.id as string

  const client = useApolloClientFromNuxt()

  const { data, errors } = await client
    .query({
      query: projectWebhookAccessCheckQuery,
      variables: { id: projectId },
      context: {
        skipLoggingErrors: true
      }
    })
    .catch(convertThrowIntoFetchResult)

  // If project succesfully resolved, move on
  if (data?.project?.webhooks.items) return

  const isForbidden = (errors || []).find((e) => e.extensions['code'] === 'FORBIDDEN')

  if (isForbidden) {
    return abortNavigation(
      createError({
        statusCode: 403,
        message: 'You do not have access to webhooks for this project'
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
})
