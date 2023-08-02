import { moduleLogger, crossServerSyncLogger } from '@/logging/logging'
import { ensureOnboardingProject } from '@/modules/cross-server-sync/services/onboardingProject'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'

const crossServerSyncModule: SpeckleModule = {
  init() {
    moduleLogger.info('🔄️ Init cross-server-sync module')
  },
  finalize() {
    crossServerSyncLogger.info('⬇️  Ensuring base onboarding stream asynchronously...')
    void ensureOnboardingProject().catch((err) =>
      crossServerSyncLogger.error(err, 'Error ensuring onboarding stream')
    )
  }
}

export = crossServerSyncModule
