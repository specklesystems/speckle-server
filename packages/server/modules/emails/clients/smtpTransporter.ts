import { emailLogger as logger } from '@/observability/logging'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { isEmailEnabled, isTestEnv } from '@/modules/shared/helpers/envHelper'
import { createTransport } from 'nodemailer'
import type { EmailTransport } from '@/modules/emails/domain/types'

let transporter: EmailTransport | undefined = undefined

const createJsonEchoTransporter = () => createTransport({ jsonTransport: true })

const initSmtpTransporter = async () => {
  try {
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
  } catch (e) {
    logger.error(e, '📧 Email provider is misconfigured, check config variables.')
  }
}

export async function initializeTransporter(): Promise<EmailTransport | undefined> {
  let newTransporter = undefined

  if (isEmailEnabled()) {
    newTransporter = await initSmtpTransporter()

    if (!newTransporter) {
      const message =
        '📧 Email provider is enabled but transport has not initialized correctly. Please review the email configuration or your email system for problems.'
      logger.error(message)
      throw new MisconfiguredEnvironmentError(message)
    }
  }

  if (!newTransporter && isTestEnv()) {
    newTransporter = createJsonEchoTransporter()
    if (!newTransporter) {
      const message =
        '📧 In testing a mock email provider is enabled but transport has not initialized correctly.'
      logger.error(message)
      throw new MisconfiguredEnvironmentError(message)
    }
  }

  if (!newTransporter) {
    logger.warn(
      '📧 Email provider is not configured. Server functionality will be limited.'
    )
  }

  transporter = newTransporter
  return newTransporter
}

export function getTransporter(): EmailTransport | undefined {
  return transporter
}
