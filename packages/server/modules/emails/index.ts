/* istanbul ignore file */
import { emailLogger, moduleLogger } from '@/observability/logging'
import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import RestApi from '@/modules/emails/rest/index'
import {
  getEmailTransporterType,
  isEmailEnabled,
  isEmailSandboxMode
} from '@/modules/shared/helpers/envHelper'
import { initializeEmailTransport } from '@/modules/emails/clients/transportBuilder'

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
    }

    // init rest api
    RestApi(app)
  }
}

export default {
  ...emailsModule
}
