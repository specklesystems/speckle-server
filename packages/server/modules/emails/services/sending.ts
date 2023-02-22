import { logger } from '@/logging/logging'
import { getTransporter } from '@/modules/emails/utils/transporter'

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
    logger.error('No email transport present. Cannot send emails.')
    return false
  }
  try {
    const emailFrom = process.env.EMAIL_FROM || 'no-reply@speckle.systems'
    return await transporter.sendMail({
      from: from || `"Speckle" <${emailFrom}>`,
      to,
      subject,
      text,
      html
    })
  } catch (error) {
    logger.error(error)
  }

  return false
}
