/* istanbul ignore file */
import { emailLogger, moduleLogger } from '@/observability/logging'
import * as SendingService from '@/modules/emails/services/sending'
import { initializeSMTPTransporter } from '@/modules/emails/clients/smtpTransporter'
import { initializeMailjetTransporter } from '@/modules/emails/clients/mailjetApi'
import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import RestApi from '@/modules/emails/rest/index'
import {
  getEmailTransporterType,
  isEmailEnabled
} from '@/modules/shared/helpers/envHelper'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'

const emailsModule: SpeckleModule = {
  init: async ({ app }) => {
    moduleLogger.info('📧 Init emails module')

    const emailTransportType = getEmailTransporterType()
    if (isEmailEnabled()) {
      switch (emailTransportType) {
        case 'smtp':
          moduleLogger.info('📧 Using SMTP email transporter')
          await initializeSMTPTransporter({ logger: emailLogger })
          break
        case 'mailjet':
          moduleLogger.info('📧 Using Mailjet email transporter')
          await initializeMailjetTransporter({ logger: emailLogger })
        default:
          throw new MisconfiguredEnvironmentError(
            `📧 Unsupported email transporter type: ${emailTransportType}`
          )
      }
    }

    // init rest api
    RestApi(app)
  }
}

/**
 * @deprecated Use `sendEmail` from `@/modules/emails/services/sending` instead
 */
async function sendEmail({
  from,
  to,
  subject,
  text,
  html
}: {
  from?: string
  to: string
  subject: string
  text: string
  html: string
}) {
  return SendingService.sendEmail({ from, to, subject, text, html })
}

export default {
  ...emailsModule,
  sendEmail
}
