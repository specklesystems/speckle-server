import { moduleLogger } from '@/logging/logging'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'

const crossServerSyncModule: SpeckleModule = {
  init() {
    moduleLogger.info('🔄️ Init cross-server-sync module')

    // TODO:
    // 1. pull stream from target server and mark it as onboarding base
  }
}

export = crossServerSyncModule
