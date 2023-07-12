import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { projectModelCheckQuery } from '~~/lib/projects/graphql/queries'

/**
 * Used in project page to validate that project ID refers to a valid project and redirects to 404 if not
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const projectId = to.params.id as string
  const modelId = to.params.modelId as string

  const client = useApolloClientFromNuxt()

  const { data, errors } = await client
    .query({
      query: projectModelCheckQuery,
      variables: { projectId, modelId }
    })
    .catch(convertThrowIntoFetchResult)

  // If project succesfully resolved, move on
  if (data?.project?.model?.id) return

  const isForbidden = (errors || []).find((e) => e.extensions['code'] === 'FORBIDDEN')
  const isProjectNotFound = (errors || []).find(
    (e) => e.extensions['code'] === 'STREAM_NOT_FOUND'
  )
  const isModelNotFound = (errors || []).find(
    (e) => e.extensions['code'] === 'BRANCH_NOT_FOUND'
  )
  if (isForbidden) {
    return abortNavigation(
      createError({
        statusCode: 403,
        message: 'You do not have access to this project'
      })
    )
  }

  if (isProjectNotFound) {
    return abortNavigation(
      createError({ statusCode: 404, message: 'Project not found' })
    )
  }

  if (isModelNotFound) {
    return abortNavigation(createError({ statusCode: 404, message: 'Model not found' }))
  }

  if (errors?.length) {
    const errMsg = getFirstErrorMessage(errors)
    return abortNavigation(errMsg)
  }
})
