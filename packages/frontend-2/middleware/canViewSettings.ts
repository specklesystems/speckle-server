import { graphql } from '~/lib/common/generated/gql'
import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { projectRoute } from '~~/lib/common/helpers/route'

const canViewProjectSettingsQuery = graphql(`
  query CanViewProjectSettings($projectId: String!) {
    project(id: $projectId) {
      id
      permissions {
        canReadSettings {
          ...FullPermissionCheckResult
        }
      }
    }
  }
`)

/**
 * Apply this to a page to prevent unauthenticated access to settings ensuring the user is a collaborator
 */
export default defineParallelizedNuxtRouteMiddleware(async (to) => {
  const client = useApolloClientFromNuxt()

  // Fetch project role data to check if the user is a collaborator
  const projectId = to.params.id as string
  const { data } = await client
    .query({
      query: canViewProjectSettingsQuery,
      variables: { projectId }
    })
    .catch(convertThrowIntoFetchResult)

  if (!data?.project) {
    return navigateTo(projectRoute(projectId))
  }

  const canReadSettings = data.project.permissions.canReadSettings.authorized
  if (!canReadSettings) {
    return navigateTo(projectRoute(projectId))
  }

  return undefined
})
