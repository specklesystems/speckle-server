import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { viewerLogger } from '@/observability/logging'

const viewerModule: SpeckleModule = {
  init: async () => {
    viewerLogger.info('🤩 Initializing viewer module...')
  }
}

export default viewerModule
