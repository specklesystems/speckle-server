/** TODO: Improve when composable is updated */

import { projectsRoute, workspaceRoute } from '~/lib/common/helpers/route'
import {
  activeUserWorkspaceExistenceCheckQuery,
  activeUserActiveWorkspaceCheckQuery
} from '~/lib/auth/graphql/queries'
import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { useNavigation } from '~/lib/navigation/composables/navigation'

export default defineNuxtRouteMiddleware(async (to) => {
  const isAuthPage = to.path.startsWith('/authn/')
  const isSSOPath = to.path.includes('/sso/')
  if (isAuthPage || isSSOPath) return

  const client = useApolloClientFromNuxt()
  const {
    activeWorkspaceSlug,
    isProjectsActive,
    mutateActiveWorkspaceSlug,
    mutateIsProjectsActive
  } = useNavigation()

  const isWorkspacesEnabled = useIsWorkspacesEnabled()

  if (!isWorkspacesEnabled.value) {
    mutateIsProjectsActive(true)
    return navigateTo(projectsRoute)
  }

  const { data: workspaceExistenceData } = await client
    .query({
      query: activeUserWorkspaceExistenceCheckQuery
    })
    .catch(convertThrowIntoFetchResult)

  const { data: navigationCheckData } = await client
    .query({
      query: activeUserActiveWorkspaceCheckQuery
    })
    .catch(convertThrowIntoFetchResult)

  const workspaces =
    workspaceExistenceData?.activeUser?.workspaces?.items.filter(
      (w) => w.creationState?.completed !== false
    ) ?? []
  const hasWorkspaces = workspaces.length > 0
  const activeUserActiveWorkspaceSlug =
    navigationCheckData?.activeUser?.activeWorkspace?.slug

  if (isWorkspacesEnabled.value) {
    if (activeUserActiveWorkspaceSlug) {
      activeWorkspaceSlug.value = activeUserActiveWorkspaceSlug
      return navigateTo(workspaceRoute(activeUserActiveWorkspaceSlug))
    } else if (isProjectsActive.value) {
      return navigateTo(projectsRoute)
    } else if (hasWorkspaces) {
      mutateActiveWorkspaceSlug(workspaces[0].slug)
      return navigateTo(workspaceRoute(workspaces[0].slug))
    }
  }

  mutateIsProjectsActive(true)
  return navigateTo(projectsRoute)
})
