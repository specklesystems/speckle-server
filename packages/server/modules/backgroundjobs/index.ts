import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { moduleLogger } from '@/observability/logging'

const backgroundJobsModule: SpeckleModule = {
  async init() {
    moduleLogger.info('🛠️  Init backgroundjobs module')
  }
}

export default backgroundJobsModule
