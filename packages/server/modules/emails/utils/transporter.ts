import { emailLogger as logger } from '@/observability/logging'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import {
  getEmailHost,
  getEmailPassword,
  getEmailPort,
  getEmailUsername,
  isEmailEnabled,
  isSSLEmailEnabled,
  isTestEnv,
  isTLSEmailRequired
} from '@/modules/shared/helpers/envHelper'
import type { Transporter } from 'nodemailer'
import { createTransport } from 'nodemailer'

let transporter: Transporter | undefined = undefined

const createJsonEchoTransporter = () => createTransport({ jsonTransport: true })

const initSmtpTransporter = async () => {
  try {
    const smtpTransporter = createTransport({
      host: getEmailHost(),
      port: getEmailPort(),
      requireTLS: isTLSEmailRequired(),
      secure: isSSLEmailEnabled(),
      auth: {
        user: getEmailUsername(),
        pass: getEmailPassword()
      },
      pool: true,
      maxConnections: 20,
      maxMessages: Infinity
    })
    const transporterVerified = await smtpTransporter.verify()
    if (!transporterVerified) {
      logger.error(
        '📧 Email provider is likely misconfigured as validation failed, check config variables'
      )
    }
    return smtpTransporter
  } catch (e) {
    logger.error(e, '📧 Email provider is misconfigured, check config variables.')
  }
}

export async function initializeTransporter(): Promise<Transporter | undefined> {
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

export function getTransporter(): Transporter | undefined {
  return transporter
}
