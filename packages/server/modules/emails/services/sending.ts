import { logger } from '@/logging/logging'
import { getTransporter } from '@/modules/emails/utils/transporter'
import { getEmailFromAddress } from '@/modules/shared/helpers/envHelper'

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
    logger.warn('No email transport present. Cannot send emails.')
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
    return true
  } catch (error) {
    logger.error(error)
  }

  return false
}
