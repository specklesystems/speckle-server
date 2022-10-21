import { initializeEventListener } from '@/modules/accessrequests/services/eventListener'
import { Optional, SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { modulesDebug } from '@/modules/shared/utils/logger'

let quitListeners: Optional<() => void> = undefined

const ServerAccessRequestsModule: SpeckleModule = {
  init(_, isInitial) {
    modulesDebug('🔐 Init access request module')

    if (isInitial) {
      quitListeners = initializeEventListener()
    }
  },
  shutdown() {
    quitListeners?.()
  }
}

export = ServerAccessRequestsModule
