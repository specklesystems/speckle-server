import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { projectRoute } from '~~/lib/common/helpers/route'
import { projectRoleCheckQuery } from '~~/lib/projects/graphql/queries'

/**
 * Apply this to a page to prevent unauthenticated access to settings and ensure the user is the a collaborator
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const client = useApolloClientFromNuxt()

  // Fetch project role data to check if the user is the owner
  const projectId = to.params.id as string
  const { data } = await client
    .query({
      query: projectRoleCheckQuery,
      variables: { id: projectId }
    })
    .catch(convertThrowIntoFetchResult)

  if (!data?.project) {
    return navigateTo(projectRoute(projectId))
  }

  // Check if the user is the owner of the project
  const hasRole = computed(() => data.project.role)

  if (!hasRole.value) {
    return navigateTo(projectRoute(projectId))
  }

  return undefined
})
