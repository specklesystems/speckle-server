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

    const activeWorkspaceSlug = navigationCheckData?.activeUser?.activeWorkspace?.slug
    const activeWorkspaceRole = navigationCheckData?.activeUser?.activeWorkspace?.role
    const firstWorkspace = navigationCheckData?.activeUser?.workspaces?.items?.[0]

    if (activeWorkspaceSlug && !!activeWorkspaceRole) {
      return navigateTo(workspaceRoute(activeWorkspaceSlug))
    } else if (firstWorkspace) {
      return navigateTo(workspaceRoute(firstWorkspace.slug))
    }
  }

  return navigateTo(projectsRoute)
})
