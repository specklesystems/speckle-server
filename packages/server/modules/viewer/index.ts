import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { getSavedViewsRouter } from '@/modules/viewer/rest/savedViews'
import { viewerLogger } from '@/observability/logging'

const viewerModule: SpeckleModule = {
  init: async ({ app }) => {
    if (!getFeatureFlags().FF_SAVED_VIEWS_ENABLED) return

    viewerLogger.info('🤩 Initializing viewer module...')
    app.use(getSavedViewsRouter())
  }
}

export default viewerModule
