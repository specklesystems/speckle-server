import { SpeckleModuleMocksConfig } from '@/modules/mocks'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

const config: SpeckleModuleMocksConfig = FF_WORKSPACES_MODULE_ENABLED ? {} : {}
export default config
