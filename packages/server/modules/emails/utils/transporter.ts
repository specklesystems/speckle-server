import { emailLogger as logger } from '@/observability/logging'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { isEmailEnabled, isTestEnv } from '@/modules/shared/helpers/envHelper'
import { createTransport, Transporter } from 'nodemailer'
import { getRequestLogger } from '@/observability/components/express/requestContext'

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
      maxMessages: Infinity,
      logger: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
        level: (_level: any) => {
          /* ignore */
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        trace: (...params: any[]) => (getRequestLogger() || logger).debug(params),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        debug: (...params: any[]) => (getRequestLogger() || logger).debug(params),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        info: (...params: any[]) => (getRequestLogger() || logger).info(params),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        warn: (...params: any[]) => (getRequestLogger() || logger).warn(params),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: (...params: any[]) => (getRequestLogger() || logger).error(params),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fatal: (...params: any[]) => (getRequestLogger() || logger).error(params)
      }
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
