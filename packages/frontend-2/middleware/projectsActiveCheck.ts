import { useSetActiveWorkspace } from '~/lib/user/composables/activeWorkspace'

/**
 * Clear active workspace when navigating to the projects page
 */
export default defineParallelizedNuxtRouteMiddleware(async () => {
  const { setActiveWorkspace } = useSetActiveWorkspace()
  const { isLoggedIn } = useActiveUser()
  const isWorkspacesEnabled = useIsWorkspacesEnabled()

  if (isLoggedIn.value && isWorkspacesEnabled.value) {
    await setActiveWorkspace({ id: null })
  }
})
