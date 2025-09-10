import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { createTransport } from 'nodemailer'
import type { EmailTransport } from '@/modules/emails/domain/types'
import { ensureError } from '@speckle/shared'
import type { Logger } from '@/observability/logging'
import {
  getEmailHost,
  getEmailPassword,
  getEmailPort,
  getEmailUsername,
  isSecureEmailEnabled
} from '@/modules/shared/helpers/envHelper'

const initSmtpTransporter = async () => {
  const smtpTransporter = createTransport({
    host: getEmailHost(),
    port: getEmailPort(),
    secure: isSecureEmailEnabled(),
    auth: {
      user: getEmailUsername(),
      pass: getEmailPassword()
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
