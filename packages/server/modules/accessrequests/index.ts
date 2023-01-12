import { moduleLogger } from '@/logging/logging'
import { initializeEventListener } from '@/modules/accessrequests/services/eventListener'
import { Optional, SpeckleModule } from '@/modules/shared/helpers/typeHelper'

let quitListeners: Optional<() => void> = undefined

const ServerAccessRequestsModule: SpeckleModule = {
  init(_, isInitial) {
    moduleLogger.info('🔐 Init access request module')

    if (isInitial) {
      quitListeners = initializeEventListener()
    }
  },
  shutdown() {
    quitListeners?.()
  }
}

export = ServerAccessRequestsModule
