import { db } from '@/db/knex'
import { moduleLogger } from '@/logging/logging'
import { AccessRequestsEmitter } from '@/modules/accessrequests/events/emitter'
import { initializeEventListenerFactory } from '@/modules/accessrequests/services/eventListener'
import { getStreamCollaboratorsFactory } from '@/modules/core/repositories/streams'
import { publishNotification } from '@/modules/notifications/services/publication'
import { Optional, SpeckleModule } from '@/modules/shared/helpers/typeHelper'

let quitListeners: Optional<() => void> = undefined

const ServerAccessRequestsModule: SpeckleModule = {
  init(_, isInitial) {
    moduleLogger.info('🔐 Init access request module')

    if (isInitial) {
      const initializeEventListener = initializeEventListenerFactory({
        getStreamCollaborators: getStreamCollaboratorsFactory({ db }),
        publishNotification,
        accessRequestsEventListener: AccessRequestsEmitter.listen
      })
      quitListeners = initializeEventListener()
    }
  },
  shutdown() {
    quitListeners?.()
  }
}

export = ServerAccessRequestsModule
