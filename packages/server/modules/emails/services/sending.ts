import { logger } from '@/logging/logging'
import { getTransporter } from '@/modules/emails/utils/transporter'
import { getEmailFromAddress } from '@/modules/shared/helpers/envHelper'
import { resolveMixpanelUserId } from '@speckle/shared'

export type SendEmailParams = {
  from?: string
  to: string
  subject: string
  text: string
  html: string
}

/**
 * Send out an e-mail
 */
export async function sendEmail({
  from,
  to,
  subject,
  text,
  html
}: SendEmailParams): Promise<boolean> {
  const transporter = getTransporter()
  if (!transporter) {
    logger.warn('No email transport present. Cannot send emails. Skipping send...')
    return false
  }
  try {
    const emailFrom = getEmailFromAddress()
    await transporter.sendMail({
      from: from || `"Speckle" <${emailFrom}>`,
      to,
      subject,
      text,
      html
    })
    logger.info(
      {
        subject,
        distinctId: resolveMixpanelUserId(to || '')
      },
      'Email "{subject}" sent out to distinctId {distinctId}'
    )
    return true
  } catch (error) {
    logger.error(error)
  }

  return false
}
