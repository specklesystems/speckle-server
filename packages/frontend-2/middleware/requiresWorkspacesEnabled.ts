export default defineNuxtRouteMiddleware(() => {
  const isWorkspacesEnabled = useIsWorkspacesEnabled()

  // If workspaces are enabled, continue as normal
  if (isWorkspacesEnabled.value) return

  // Otherwise, block navigation
  return abortNavigation(
    createError({
      statusCode: 404,
      message: 'Page not found'
    })
  )
})
