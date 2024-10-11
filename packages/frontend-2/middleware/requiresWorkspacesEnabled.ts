export default defineNuxtRouteMiddleware(() => {
  const isWorkspacesEnabled = useIsWorkspacesEnabled()
  if (!isWorkspacesEnabled.value) {
    return abortNavigation(
      createError({
        statusCode: 404,
        message: 'Page not found'
      })
    )
  }
})
