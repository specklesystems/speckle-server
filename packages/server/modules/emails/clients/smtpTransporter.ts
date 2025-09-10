import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { isEmailSandboxMode } from '@/modules/shared/helpers/envHelper'
import { createTransport } from 'nodemailer'
import type { EmailTransport } from '@/modules/emails/domain/types'
import { ensureError } from '@speckle/shared'
import type { Logger } from '@/observability/logging'

let transporter: EmailTransport | undefined = undefined

const createJsonEchoTransporter = () => createTransport({ jsonTransport: true })

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
  logger: Logger
}): Promise<EmailTransport | undefined> {
  let newTransporter = undefined

  if (!isEmailSandboxMode()) {
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
  } else {
    newTransporter = createJsonEchoTransporter()
    if (!newTransporter) {
      const message =
        '📧 In testing or email sandbox mode a mock email provider is enabled but transport has not initialized correctly.'
      deps.logger.error(message)
      throw new MisconfiguredEnvironmentError(message)
    }
  }

  if (!newTransporter) {
    deps.logger.warn(
      '📧 Email provider is not configured. Server functionality will be limited.'
    )
  }

  transporter = newTransporter
  return newTransporter
}

export function getTransporter(): EmailTransport | undefined {
  return transporter
}
