import { emailLogger } from '@/observability/logging'
import type { SendEmail, SendEmailParams } from '@/modules/emails/domain/operations'
import { getTransporter } from '@/modules/emails/clients/smtpTransporter'
import { getEmailFromAddress } from '@/modules/shared/helpers/envHelper'
import { ensureError, resolveMixpanelUserId } from '@speckle/shared'
import {
  getRequestLogger,
  loggerWithMaybeContext
} from '@/observability/utils/requestContext'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { EmailsEvents } from '@/modules/emails/domain/events'
import type { EmailOptions } from '@/modules/emails/domain/types'

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

  try {
    const baseOptions = {
      to,
      subject,
      text,
      html
    }

    await eventBus.emit({
      eventName: EmailsEvents.PreparingToSend,
      payload: { options: baseOptions }
    })

    const transporter = getTransporter()
    if (!transporter) {
      logger.warn('No email transport present. Cannot send emails. Skipping send...')
      return false
    }

    const emailFrom = getEmailFromAddress()
    const options: EmailOptions = {
      ...baseOptions,
      from: from || `"Speckle" <${emailFrom}>`
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
    const err = ensureError(error, 'Unknown error when sending email')
    logger.error(err, 'Error sending email')
  }
  return false
}

export type { SendEmailParams } from '@/modules/emails/domain/operations'
