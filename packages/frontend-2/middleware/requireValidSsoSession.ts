import { until } from '@vueuse/core'
import { workspaceRoute, settingsWorkspaceRoutes } from '~/lib/common/helpers/route'
import { useWorkspaceSsoStatus } from '~/lib/workspaces/composables/sso'

/**
 * Validate that a user has an active SSO session for the workspace
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // General settings can always bed accessed
  if (to.name === settingsWorkspaceRoutes.general.name) {
    return
  }

  const workspaceSlug = computed(() => to.params.slug as string)
  if (!workspaceSlug.value) return

  const { needsSsoLogin, loading } = useWorkspaceSsoStatus({ workspaceSlug })

  await until(loading).toBe(false)

  if (needsSsoLogin.value) {
    return navigateTo(workspaceRoute(workspaceSlug.value))
  }
})
