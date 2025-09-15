import { emailLogger, moduleLogger } from '@/observability/logging'
import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import RestApi from '@/modules/emails/rest/index'
import { isEmailEnabled, isTestEnv } from '@/modules/shared/helpers/envHelper'
import { initializeEmailTransport } from '@/modules/emails/clients/transportBuilder'

const emailsModule: SpeckleModule = {
  init: async ({ app }) => {
    moduleLogger.info('📧 Init emails module')

    await initializeEmailTransport({
      isSandboxMode: !isEmailEnabled() && isTestEnv(),
      logger: emailLogger
    })

    // init rest api
    RestApi(app)
  }
}

export default {
  ...emailsModule
}
