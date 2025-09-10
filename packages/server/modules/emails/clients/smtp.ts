import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { createTransport } from 'nodemailer'
import type { EmailTransport } from '@/modules/emails/domain/types'
import { ensureError } from '@speckle/shared'
import type { Logger } from '@/observability/logging'

const initSmtpTransporter = async () => {
  const smtpTransporter = createTransport({
    host: process.env.EMAIL_HOST || '127.0.0.1',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    },
    pool: true,
    maxConnections: 20,
    maxMessages: Infinity
  })
  await smtpTransporter.verify()
  return smtpTransporter
}

export async function initializeSMTPTransporter(deps: {
  isSandboxMode: boolean
  logger: Logger
}): Promise<EmailTransport | undefined> {
  let newTransporter = undefined

  const errorMessage =
    '📧 Email provider is enabled but transport has not initialized correctly. Please review the email configuration or your email system for problems.'
  try {
    newTransporter = await initSmtpTransporter()
  } catch (e) {
    const err = ensureError(e, 'Unknown error while initializing SMTP transporter')
    deps.logger.error(err, errorMessage)
    throw new MisconfiguredEnvironmentError(errorMessage, { cause: err })
  }

  if (!newTransporter) {
    deps.logger.error(errorMessage)
    throw new MisconfiguredEnvironmentError(errorMessage)
  }

  return newTransporter
}
