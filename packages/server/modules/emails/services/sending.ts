import { getTransporter } from '@/modules/emails/utils/transporter'
import dbg from 'debug'

const debug = dbg('speckle')
const errorDebug = debug.extend('errors')

/**
 * Send out an e-mail
 */
export async function sendEmail({
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
}): Promise<boolean> {
  const transporter = getTransporter()
  if (!transporter) {
    errorDebug('No email transport present. Cannot send emails.')
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
    errorDebug(error)
  }

  return false
}
