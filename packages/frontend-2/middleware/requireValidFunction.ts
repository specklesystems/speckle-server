import { functionAccessCheckQuery } from '~/lib/automate/graphql/queries'
import { useApolloClientFromNuxt } from '~/lib/common/composables/graphql'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~/lib/common/helpers/graphql'

export default defineNuxtRouteMiddleware(async (to) => {
  const functionId = to.params.fid as string

  const isAutomateEnabled = useIsAutomateModuleEnabled()
  if (!isAutomateEnabled.value) {
    return abortNavigation(
      createError({
        statusCode: 404,
        message: 'Page not found'
      })
    )
  }

  const client = useApolloClientFromNuxt()

  const { data, errors } = await client
    .query({
      query: functionAccessCheckQuery,
      variables: { id: functionId },
      context: {
        skipLoggingErrors: true
      }
    })
    .catch(convertThrowIntoFetchResult)

  if (data?.automateFunction?.id) return

  const isNotFound = (errors || []).find(
    (e) => e.extensions['code'] === 'FUNCTION_NOT_FOUND'
  )
  if (isNotFound) {
    return abortNavigation(
      createError({ statusCode: 404, message: 'Function not found' })
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
