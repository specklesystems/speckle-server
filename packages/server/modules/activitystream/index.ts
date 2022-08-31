import { initializeEventListener } from '@/modules/activitystream/services/eventListener'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { modulesDebug } from '@/modules/shared/utils/logger'

const activityStreamModule: SpeckleModule = {
  init(_, isInitial) {
    modulesDebug('📅 Initializing activity-stream')

    if (isInitial) {
      initializeEventListener()
    }
  }
}

export = {
  ...activityStreamModule
}
