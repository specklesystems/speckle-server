const disabledRoutes = ['/auth', '/models/']

export const useIntercomEnabled = () => {
  const {
    public: { intercomAppId }
  } = useRuntimeConfig()

  const isWorkspacesEnabled = useIsWorkspacesEnabled()
  const route = useRoute()

  const isRouteBlacklisted = computed(() => {
    return disabledRoutes.some((disabledRoute) => route.path.includes(disabledRoute))
  })

  const isIntercomEnabled = computed(() => {
    return !!intercomAppId && isWorkspacesEnabled.value
  })

  return {
    isIntercomEnabled,
    isRouteBlacklisted
  }
}
