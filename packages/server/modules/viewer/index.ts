import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { viewerLogger } from '@/observability/logging'

const viewerModule: SpeckleModule = {
  init: async () => {
    if (!getFeatureFlags().FF_SAVED_VIEWS_ENABLED) return
    viewerLogger.info('🤩 Initializing viewer module...')
  }
}

export default viewerModule
