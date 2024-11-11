export const useIsMultiregionEnabled = () => {
  const {
    public: { FF_WORKSPACES_MODULE_ENABLED, FF_WORKSPACES_MULTI_REGION_ENABLED }
  } = useRuntimeConfig()

  return !!(FF_WORKSPACES_MODULE_ENABLED && FF_WORKSPACES_MULTI_REGION_ENABLED)
}
