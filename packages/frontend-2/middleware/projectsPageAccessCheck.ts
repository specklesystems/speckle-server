import { useActiveUserProjectsToMove } from '~~/lib/auth/composables/activeUser'
import { homeRoute } from '~/lib/common/helpers/route'

export default defineNuxtRouteMiddleware(() => {
  const isWorkspacesEnabled = useIsWorkspacesEnabled()
  const { hasProjectsToMove } = useActiveUserProjectsToMove()

  // If workspaces are not enabled, continue as susual
  if (!isWorkspacesEnabled.value) return

  // If no projects to move, redirect to root which handles further redirects
  if (!hasProjectsToMove.value) {
    return navigateTo(homeRoute)
  }
})
