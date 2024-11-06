import { useWorkspaceSso } from '~/lib/workspaces/composables/management'

export default defineNuxtRouteMiddleware(async (to) => {
  const workspaceSlug = to.params.slug as string
  const logger = useLogger()

  // Skip SSO check in these cases:
  // 1. Already in SSO flow
  // 2. Has access_code (completing SSO)
  // 3. Has invite token
  if (to.path.includes('/sso') || to.query.access_code || to.query.token) {
    return
  }

  const { hasSsoEnabled, needsSsoLogin, error } = useWorkspaceSso({
    workspaceSlug
  })

  if (error.value) {
    logger.error('SSO check failed:', error.value)
    return abortNavigation(
      createError({
        statusCode: 500,
        message: 'Failed to check workspace SSO requirements'
      })
    )
  }

  if (hasSsoEnabled.value && needsSsoLogin.value) {
    return navigateTo({
      path: `/workspaces/${workspaceSlug}/sso`,
      query: {
        redirect: to.fullPath
      }
    })
  }
})
