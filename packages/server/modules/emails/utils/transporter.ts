import { logger, moduleLogger } from '@/logging/logging'
import { isEmailEnabled, isTestEnv } from '@/modules/shared/helpers/envHelper'
import { createTransport, Transporter } from 'nodemailer'

let transporter: Transporter | undefined = undefined

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

export async function initializeTransporter(): Promise<Transporter | undefined> {
  let newTransporter = undefined

  if (isEmailEnabled()) {
    newTransporter = await initSmtpTransporter()

    if (!newTransporter) {
      const message =
        '📧 Email provider is enabled but transport has not initialized correctly. Please review the email configuration or your email system for problems.'
      moduleLogger.error(message)
      throw new Error(message)
    }
  }

  if (!newTransporter && isTestEnv()) {
    newTransporter = createJsonEchoTransporter()
    if (!newTransporter) {
      const message =
        '📧 In testing a mock email provider is enabled but transport has not initialized correctly.'
      moduleLogger.error(message)
      throw new Error(message)
    }
  }

  if (!newTransporter) {
    moduleLogger.warn(
      '📧 Email provider is not configured. Server functionality will be limited.'
    )
  }

  transporter = newTransporter
  return newTransporter
}

export function getTransporter(): Transporter | undefined {
  return transporter
}
