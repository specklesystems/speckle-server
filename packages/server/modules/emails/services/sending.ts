import { emailLogger as logger } from '@/observability/logging'
import { SendEmail, SendEmailParams } from '@/modules/emails/domain/operations'
import { getTransporter } from '@/modules/emails/utils/transporter'
import { getEmailFromAddress } from '@/modules/shared/helpers/envHelper'
import { resolveMixpanelUserId } from '@speckle/shared'

export type { SendEmailParams } from '@/modules/emails/domain/operations'
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
