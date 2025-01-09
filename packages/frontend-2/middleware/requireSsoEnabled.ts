import { workspaceRoute } from '~/lib/common/helpers/route'
import { useWorkspacePublicSsoCheck } from '~/lib/workspaces/composables/sso'

/**
 * Used to validate that the workspace has SSO enabled, redirects to workspace page if not
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // Skip middleware when handling SSO callback with access code.
  // This page serves as both the SSO login page and OAuth callback URL.
  // We need to let the callback through to process the access code before any redirects.
  if (to.query.access_code) {
    return
  }

  const workspaceSlug = computed(() => to.params.slug as string)

  if (!workspaceSlug) return

  const { workspace } = useWorkspacePublicSsoCheck(workspaceSlug)
  if (!workspace.value?.ssoProviderName) {
    return navigateTo(workspaceRoute(workspaceSlug.value))
  }
})
