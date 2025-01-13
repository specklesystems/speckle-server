import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'

export const isMultiRegionEnabled = () => {
  const { FF_WORKSPACES_MODULE_ENABLED, FF_WORKSPACES_MULTI_REGION_ENABLED } =
    getFeatureFlags()
  return !!(FF_WORKSPACES_MODULE_ENABLED && FF_WORKSPACES_MULTI_REGION_ENABLED)
}
