export default defineNuxtRouteMiddleware(() => {
  const isAutomateEnabled = useIsAutomateModuleEnabled()
  if (!isAutomateEnabled.value) {
    return abortNavigation(
      createError({
        statusCode: 404,
        message: 'Page not found'
      })
    )
  }
})
