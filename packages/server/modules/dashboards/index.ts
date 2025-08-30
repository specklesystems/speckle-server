import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { moduleLogger } from '@/observability/logging'
import { getFeatureFlags } from '@speckle/shared/environment'

const { FF_WORKSPACES_MODULE_ENABLED, FF_DASHBOARDS_MODULE_ENABLED } = getFeatureFlags()

const dashboardsModule: SpeckleModule = {
  init: async () => {
    if (!FF_WORKSPACES_MODULE_ENABLED || !FF_DASHBOARDS_MODULE_ENABLED) return
    moduleLogger.info('🧢 Init dashboards module')
  }
}

export default dashboardsModule
