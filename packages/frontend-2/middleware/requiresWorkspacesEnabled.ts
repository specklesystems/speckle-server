export default defineNuxtRouteMiddleware((to) => {
  const isWorkspacesEnabled = useIsWorkspacesEnabled()

  // If workspaces are enabled, continue as normal
  if (isWorkspacesEnabled.value) return

  // If there's an SSO error, redirect to the main workspace page with provider details
  const hasSsoError = to.query.ssoError || to.query.ssoValidationSuccess === 'false'

  if (hasSsoError) {
    // Collect provider details from URL
    const providerDetails = {
      providerName: to.query.providerName,
      clientId: to.query.clientId,
      issuerUrl: to.query.issuerUrl
    }

    // Only include non-null values
    const queryParams = Object.fromEntries(
      Object.entries(providerDetails).filter(([_, value]) => value)
    )

    // Add the error message
    if (to.query.ssoError) {
      queryParams.error = to.query.ssoError as string
    }

    // Add a flag to open the settings dialog
    queryParams.openSettingsDialog = 'true'

    // Redirect to the main workspace page
    return navigateTo({
      path: `/workspaces/${to.params.slug}`,
      query: queryParams
    })
  }

  // Otherwise, block navigation
  return abortNavigation(
    createError({
      statusCode: 404,
      message: 'Page not found'
    })
  )
})
