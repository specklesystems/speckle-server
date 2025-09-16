import { emailLogger, moduleLogger } from '@/observability/logging'
import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import RestApi from '@/modules/emails/rest/index'
import { isEmailEnabled, isTestEnv } from '@/modules/shared/helpers/envHelper'
import { initializeEmailTransport } from '@/modules/emails/clients/transportBuilder'

const emailsModule: SpeckleModule = {
  init: async ({ app }) => {
    moduleLogger.info('📧 Init emails module')

    if (isEmailEnabled()) {
      await initializeEmailTransport({
        logger: emailLogger
      })
    } else if (isTestEnv()) {
      await initializeEmailTransport({
        isSandboxMode: true,
        logger: emailLogger
      })
    } else {
      moduleLogger.warn('📧 Email functionality is disabled')
    }

    // init rest api
    RestApi(app)
  }
}

export default {
  ...emailsModule
}
