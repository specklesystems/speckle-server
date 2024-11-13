import { workspaceRoute } from '~/lib/common/helpers/route'
import { useWorkspaceSsoPublic } from '~/lib/workspaces/composables/sso'

/**
 * Used to validate that the workspace has SSO enabled, redirects to workspace page if not
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const workspaceSlug = to.params.slug as string
  if (!workspaceSlug) return

  const { workspace } = useWorkspaceSsoPublic(workspaceSlug)
  if (!workspace.value?.ssoProviderName) {
    return navigateTo(workspaceRoute(workspaceSlug))
  }
})
