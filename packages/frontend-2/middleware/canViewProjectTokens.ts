import { graphql } from '~/lib/common/generated/gql'
import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { projectRoute } from '~~/lib/common/helpers/route'

const canViewProjectTokensQuery = graphql(`
  query CanViewProjectTokens($projectId: String!) {
    project(id: $projectId) {
      id
      permissions {
        canReadEmbedTokens {
          ...FullPermissionCheckResult
        }
      }
    }
  }
`)

/**
 * Apply this to a page to prevent unauthenticated access to tokens and ensure the user is the owner
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const client = useApolloClientFromNuxt()

  const projectId = to.params.id as string
  const { data } = await client
    .query({
      query: canViewProjectTokensQuery,
      variables: { projectId }
    })
    .catch(convertThrowIntoFetchResult)

  if (!data?.project) {
    return navigateTo(projectRoute(projectId))
  }

  const canReadTokens = data.project.permissions.canReadEmbedTokens.authorized
  if (!canReadTokens) {
    return navigateTo(projectRoute(projectId))
  }
})
