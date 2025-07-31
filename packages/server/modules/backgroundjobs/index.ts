import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { moduleLogger } from '@/observability/logging'
import {
  shutdownSchedule,
  startSchedule
} from '@/modules/backgroundjobs/services/schedule'

const backgroundJobsModule: SpeckleModule = {
  async init({ isInitial }) {
    moduleLogger.info('🛠️  Init backgroundjobs module')

    if (isInitial) {
      startSchedule()
    }
  },
  async shutdown() {
    shutdownSchedule()
  }
}

export default backgroundJobsModule
