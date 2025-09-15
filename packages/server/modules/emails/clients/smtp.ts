import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { createTransport } from 'nodemailer'
import type { EmailTransport } from '@/modules/emails/domain/types'
import { ensureError } from '@speckle/shared'
import type { Logger } from '@/observability/logging'
import { EmailTransportInitializationError } from '@/modules/emails/errors'
import { SentEmailDeliveryStatus } from '@/modules/emails/domain/consts'
import type { SentMessageInfo } from 'nodemailer/lib/smtp-pool'

type SMTPConfig = {
  host: string
  port: number
  sslEnabled: boolean
  tlsRequired: boolean
  auth: { username: string; password: string }
}

const initSmtpTransporter = async (params: SMTPConfig & { logger: Logger }) => {
  if (!params.tlsRequired && !params.sslEnabled) {
    params.logger.warn(
      'Neither EMAIL_SECURE and EMAIL_REQUIRE_TLS are true. Client will attempt to upgrade to TLS on connect, but will default to whatever the server supports which may be insecure.'
    )
  } else if (params.tlsRequired && params.sslEnabled) {
    throw new MisconfiguredEnvironmentError(
      'EMAIL_SECURE and EMAIL_REQUIRE_TLS cannot both be true. TLS would typically be preferred over SSL.'
    )
  }
  const smtpTransporter = createTransport({
    host: params.host,
    port: params.port,
    requireTLS: params.tlsRequired,
    secure: params.sslEnabled,
    auth: {
      user: params.auth.username,
      pass: params.auth.password
    },
    pool: true,
    maxConnections: 20,
    maxMessages: Infinity
  })
  const verifyResult = await smtpTransporter.verify()
  if (!verifyResult) {
    throw new EmailTransportInitializationError(
      'SMTP transporter verification failed. Please check your SMTP configuration.'
    )
  }

  const wrappedTransporter: EmailTransport = {
    sendMail: async (options) => {
      const response = await smtpTransporter.sendMail(options)

      return {
        messageId: response.messageId,
        status: mapSMTPResponseToSentEmailDeliveryStatus(response),
        errorMessages: response.rejectedErrors?.map((e) => `${e.code}: ${e.message}`)
      }
    }
  }

  return wrappedTransporter
}

export async function initializeSMTPTransporter(
  deps: SMTPConfig & {
    isSandboxMode: boolean
    logger: Logger
  }
): Promise<EmailTransport | undefined> {
  let newTransporter = undefined

  const errorMessage =
    '📧 Email provider is enabled but transport has not initialized correctly. Please review the email configuration or your email system for problems.'
  try {
    newTransporter = await initSmtpTransporter(deps)
  } catch (e) {
    const err = ensureError(e, 'Unknown error while initializing SMTP transporter')
    deps.logger.error(err, errorMessage)
    throw new EmailTransportInitializationError(errorMessage, { cause: err })
  }

  if (!newTransporter) {
    deps.logger.error(errorMessage)
    throw new EmailTransportInitializationError(errorMessage)
  }

  return newTransporter
}
function mapSMTPResponseToSentEmailDeliveryStatus(
  response: SentMessageInfo
): SentEmailDeliveryStatus {
  if (response.rejected.length > 0) {
    return SentEmailDeliveryStatus.FAILED
  }

  if (response.accepted.length === 0) {
    // this should not happen, but just in case
    return SentEmailDeliveryStatus.PENDING
  }

  return SentEmailDeliveryStatus.SENT
}
