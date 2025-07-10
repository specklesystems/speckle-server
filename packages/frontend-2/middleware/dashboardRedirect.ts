import { projectsRoute, workspaceRoute } from '~/lib/common/helpers/route'
import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import { activeUserActiveWorkspaceCheckQuery } from '~/lib/auth/graphql/queries'

export default defineNuxtRouteMiddleware(async () => {
  const isWorkspacesEnabled = useIsWorkspacesEnabled()
  const client = useApolloClientFromNuxt()

  if (isWorkspacesEnabled.value) {
    const { data: navigationCheckData } = await client
      .query({
        query: activeUserActiveWorkspaceCheckQuery
      })
      .catch(convertThrowIntoFetchResult)

    if (navigationCheckData?.activeUser?.activeWorkspace?.slug) {
      return navigateTo(
        workspaceRoute(navigationCheckData.activeUser.activeWorkspace.slug)
      )
    }
  }

  return navigateTo(projectsRoute)
})
