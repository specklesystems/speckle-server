import { db } from '@/db/knex'
import { moduleLogger } from '@/observability/logging'
import { initializeEventListenerFactory } from '@/modules/accessrequests/services/eventListener'
import { getStreamCollaboratorsFactory } from '@/modules/core/repositories/streams'
import { publishNotification } from '@/modules/notifications/services/publication'
import { Optional, SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { getEventBus } from '@/modules/shared/services/eventBus'

let quitListeners: Optional<() => void> = undefined

const ServerAccessRequestsModule: SpeckleModule = {
  init(_, isInitial) {
    moduleLogger.info('🔐 Init access request module')

    if (isInitial) {
      const initializeEventListener = initializeEventListenerFactory({
        getStreamCollaborators: getStreamCollaboratorsFactory({ db }),
        publishNotification,
        eventBus: getEventBus()
      })
      quitListeners = initializeEventListener()
    }
  },
  shutdown() {
    quitListeners?.()
  }
}

export = ServerAccessRequestsModule
