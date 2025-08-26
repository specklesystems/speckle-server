import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { moduleLogger } from '@/observability/logging'

const dashboardsModule: SpeckleModule = {
  init: async ({ isInitial }) => {
    moduleLogger.info('🧢 Init dashboards module')
  }
}
