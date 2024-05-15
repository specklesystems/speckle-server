import { Roles } from '@speckle/shared'
import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { projectSettingsRoute } from '~~/lib/common/helpers/route'
import { projectRoleCheckQuery } from '~~/lib/projects/graphql/queries'

/**
 * Apply this to a page to prevent unauthenticated access to webhooks and ensure the user is the owner
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

  // Check if the user is the owner of the project
  const isOwner = data?.project.role === Roles.Stream.Owner

  if (!isOwner) {
    return navigateTo(projectSettingsRoute(projectId))
  }

  return undefined
})
