/* istanbul ignore file */
import { moduleLogger } from '@/logging/logging'
import * as SendingService from '@/modules/emails/services/sending'
import { initializeTransporter } from '@/modules/emails/utils/transporter'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'

const emailsModule: SpeckleModule = {
  init: async (app) => {
    moduleLogger.info('📧 Init emails module')

    // init transporter
    await initializeTransporter()

    // init rest api
    ;(await import('./rest')).default(app)
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

export = {
  ...emailsModule,
  sendEmail
}
