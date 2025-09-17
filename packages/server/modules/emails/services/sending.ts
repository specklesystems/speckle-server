import { emailLogger } from '@/observability/logging'
import type { SendEmail, SendEmailParams } from '@/modules/emails/domain/operations'
import { getTransporter } from '@/modules/emails/clients/transportBuilder'
import { getEmailFromAddress } from '@/modules/shared/helpers/envHelper'
import { ensureError, resolveMixpanelUserId } from '@speckle/shared'
import {
  getRequestContext,
  getRequestLogger,
  loggerWithMaybeContext
} from '@/observability/utils/requestContext'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { EmailsEvents } from '@/modules/emails/domain/events'
import type { EmailOptions } from '@/modules/emails/domain/types'
import cryptoRandomString from 'crypto-random-string'

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
  const context = getRequestContext()

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
    if (context && 'requestId' in context) {
      // add some random digits to avoid collisions if multiple emails are sent within the same request
      options.speckleEmailId = `${context.requestId}_${cryptoRandomString({
        length: 4
      })}`
    }

    const sentEmailResponse = await transporter.sendMail(options)
    await eventBus.emit({
      eventName: EmailsEvents.Sent,
      payload: {
        options,
        deliveryStatus: sentEmailResponse.status,
        deliverErrorMessages: sentEmailResponse.errorMessages
      }
    })

    const emails = typeof to === 'string' ? [to] : to
    const distinctIds = await Promise.all(
      emails.map((email) => resolveMixpanelUserId(email))
    )

    logger.info(
      {
        subject,
        distinctIds,
        deliveryStatus: sentEmailResponse.status,
        deliveryErrorMessages: sentEmailResponse.errorMessages
      },
      'Email "{subject}" sent out to distinctIds {distinctIds}; status: {deliveryStatus}'
    )

    return true
  } catch (error) {
    const err = ensureError(error, 'Unknown error when sending email')
    logger.error(err, 'Error sending email')
  }
  return false
}

export type { SendEmailParams } from '@/modules/emails/domain/operations'
