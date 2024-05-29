import { useApolloClientFromNuxt } from '~/lib/common/composables/graphql'
import {
  convertThrowIntoFetchResult,
  errorFailedAtPathSegment,
  getFirstErrorMessage,
  resolveGenericStatusCode
} from '~/lib/common/helpers/graphql'
import { projectAutomationAccessCheckQuery } from '~/lib/projects/graphql/queries'

export default defineNuxtRouteMiddleware(async (to) => {
  const projectId = to.params.id as string
  // const automationId = to.params.aid as string

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
      query: projectAutomationAccessCheckQuery,
      variables: { projectId },
      context: {
        skipLoggingErrors: true
      }
    })
    .catch(convertThrowIntoFetchResult)

  if (data?.project?.automations) return

  const isForbidden = (errors || []).find((e) => e.extensions['code'] === 'FORBIDDEN')
  const isNotFoundProject = (errors || []).find(
    (e) => e.extensions['code'] === 'STREAM_NOT_FOUND'
  )
  const isNotFoundAutomation = (errors || []).find(
    (e) => e.extensions['code'] === 'AUTOMATION_NOT_FOUND'
  )
  if (isForbidden) {
    return abortNavigation(
      createError({
        statusCode: 403,
        message: errorFailedAtPathSegment(isForbidden, 'project')
          ? 'You do not have access to this project'
          : 'Only project owners can access project automations'
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
        statusCode: resolveGenericStatusCode(errors),
        message: errMsg
      })
    )
  }
})
