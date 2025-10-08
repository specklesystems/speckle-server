import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { getSavedViewsRouter } from '@/modules/viewer/rest/savedViews'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { publish } from '@/modules/shared/utils/subscriptions'
import { reportSubscriptionEventsFactory } from '@/modules/viewer/events/subscriptionListeners'
import { viewerLogger } from '@/observability/logging'

const viewerModule: SpeckleModule = {
  init: async ({ app, isInitial }) => {
    if (!getFeatureFlags().FF_SAVED_VIEWS_ENABLED) return

    viewerLogger.info('🤩 Initializing viewer module...')
    app.use(getSavedViewsRouter())

    if (isInitial) {
      reportSubscriptionEventsFactory({
        listen: getEventBus().listen,
        publish
      })()
    }
  }
}

export default viewerModule
