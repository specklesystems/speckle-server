import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { publish } from '@/modules/shared/utils/subscriptions'
import { reportSubscriptionEventsFactory } from '@/modules/viewer/events/subscriptionListeners'
import { viewerLogger } from '@/observability/logging'

const viewerModule: SpeckleModule = {
  init: async ({ isInitial }) => {
    if (!getFeatureFlags().FF_SAVED_VIEWS_ENABLED) return

    viewerLogger.info('🤩 Initializing viewer module...')
    if (isInitial) {
      reportSubscriptionEventsFactory({
        listen: getEventBus().listen,
        publish
      })()
    }
  }
}

export default viewerModule
