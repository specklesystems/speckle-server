import { emailLogger } from '@/observability/logging'
import { SendEmail, SendEmailParams } from '@/modules/emails/domain/operations'
import { getTransporter } from '@/modules/emails/utils/transporter'
import { getEmailFromAddress } from '@/modules/shared/helpers/envHelper'
import { resolveMixpanelUserId } from '@speckle/shared'
import {
  getRequestLogger,
  loggerWithMaybeContext
} from '@/observability/utils/requestContext'
import type Mail from 'nodemailer/lib/mailer'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { EmailsEvents } from '@/modules/emails/domain/events'

/**
 * Send out an e-mail
 */
export const sendEmail: SendEmail = async ({
  from,
  to,
  subject,
  text,
  html
}: SendEmailParams): Promise<boolean> => {
  const eventBus = getEventBus()
  const logger = getRequestLogger() || loggerWithMaybeContext({ logger: emailLogger })
  const transporter = getTransporter()

  try {
    const emailFrom = getEmailFromAddress()
    const options: Mail.Options = {
      from: from || `"Speckle" <${emailFrom}>`,
      to,
      subject,
      text,
      html
    }

    await eventBus.emit({
      eventName: EmailsEvents.PreparingToSend,
      payload: { options }
    })

    if (!transporter) {
      logger.warn('No email transport present. Cannot send emails. Skipping send...')
      return false
    }

    await transporter.sendMail(options)
    await eventBus.emit({
      eventName: EmailsEvents.Sent,
      payload: { options }
    })

    const emails = typeof to === 'string' ? [to] : to
    const distinctIds = await Promise.all(
      emails.map((email) => resolveMixpanelUserId(email))
    )
    logger.info(
      {
        subject,
        distinctIds
      },
      'Email "{subject}" sent out to distinctIds {distinctIds}'
    )
    return true
  } catch (error) {
    logger.error(error)
  }

  return false
}

export type { SendEmailParams } from '@/modules/emails/domain/operations'
