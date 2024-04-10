import { useApolloClientFromNuxt } from '~/lib/common/composables/graphql'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~/lib/common/helpers/graphql'
import { projectAutomationAccessCheckQuery } from '~/lib/projects/graphql/queries'

export default defineNuxtRouteMiddleware(async (to) => {
  const projectId = to.params.id as string
  const automationId = to.params.aid as string

  const client = useApolloClientFromNuxt()

  const { data, errors } = await client
    .query({
      query: projectAutomationAccessCheckQuery,
      variables: { projectId, automationId },
      context: {
        skipLoggingErrors: true
      }
    })
    .catch(convertThrowIntoFetchResult)

  if (data?.project?.automation?.id) return

  const isForbiddenProject = (errors || []).find(
    (e) => e.extensions['code'] === 'FORBIDDEN'
  )
  const isNotFoundProject = (errors || []).find(
    (e) => e.extensions['code'] === 'STREAM_NOT_FOUND'
  )
  const isNotFoundAutomation = (errors || []).find(
    (e) => e.extensions['code'] === 'AUTOMATION_NOT_FOUND'
  )
  if (isForbiddenProject) {
    return abortNavigation(
      createError({
        statusCode: 403,
        message: 'You do not have access to this project'
      })
    )
  }

  if (isNotFoundProject) {
    return abortNavigation(
      createError({ statusCode: 404, message: 'Project not found' })
    )
  }

  if (isNotFoundAutomation) {
    return abortNavigation(
      createError({ statusCode: 404, message: 'Automation not found' })
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
