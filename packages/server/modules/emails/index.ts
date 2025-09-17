import { emailLogger, moduleLogger } from '@/observability/logging'
import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import RestApi from '@/modules/emails/rest/index'
import {
  getEmailTransporterType,
  isEmailEnabled,
  isEmailSandboxMode,
  isTestEnv
} from '@/modules/shared/helpers/envHelper'
import { initializeEmailTransport } from '@/modules/emails/clients/transportBuilder'
import { EmailTransportType } from '@/modules/emails/domain/consts'

const emailsModule: SpeckleModule = {
  init: async ({ app }) => {
    moduleLogger.info('📧 Init emails module')

    const emailTransportType = getEmailTransporterType()
    if (isEmailEnabled()) {
      await initializeEmailTransport({
        emailTransportType,
        isSandboxMode: isEmailSandboxMode(),
        logger: emailLogger
      })
    } else if (isTestEnv()) {
      await initializeEmailTransport({
        emailTransportType: EmailTransportType.JSONEcho,
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
