import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'

export const isWorkspacesModuleEnabled = (): boolean => {
  return getFeatureFlags().FF_WORKSPACES_MODULE_ENABLED
}
