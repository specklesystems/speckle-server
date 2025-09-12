import type { EmailTransport } from '@/modules/emails/domain/types'
import {
  EmailTransportType,
  isEmailTransportType
} from '@/modules/emails/domain/consts'
import type { Logger } from '@/observability/logging'
import { LogicError, MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { initializeMailjetTransporter } from '@/modules/emails/clients/mailjetApi'
import { initializeSMTPTransporter } from '@/modules/emails/clients/smtp'
import { initializeJSONEchoTransporter } from '@/modules/emails/clients/jsonEcho'
import { initializeMailchimpTransporter } from '@/modules/emails/clients/mailchimp'
import {
  getEmailHost,
  getEmailPassword,
  getEmailPort,
  getEmailUsername,
  isSSLEmailEnabled,
  isTLSEmailRequired
} from '@/modules/shared/helpers/envHelper'

let transporter: EmailTransport | undefined = undefined

export const initializeEmailTransport = async (params: {
  emailTransportType: string
  isSandboxMode: boolean
  logger: Logger
}) => {
  const { isSandboxMode, logger } = params
  let { emailTransportType } = params
  const unsupportedTransportTypeMessage =
    'Unsupported email transporter type: {emailTransportType}'
  if (!isEmailTransportType(emailTransportType)) {
    throw new MisconfiguredEnvironmentError(unsupportedTransportTypeMessage, {
      info: { emailTransportType }
    })
  }

  if (emailTransportType === EmailTransportType.SMTP && params.isSandboxMode) {
    // if we're in sandbox mode, we won't use SMTP as our transport, so we switch to JSON echo
    // this retains legacy behaviour
    emailTransportType = EmailTransportType.JSONEcho
    logger.info(
      '📧 SMTP email transport selected but email sandbox mode is enabled, switching to JSON Echo transport'
    )
  }

  switch (emailTransportType) {
    case EmailTransportType.SMTP:
      logger.info('📧 Using SMTP email transporter')
      transporter = await initializeSMTPTransporter({
        host: getEmailHost(),
        port: getEmailPort(),
        sslEnabled: isSSLEmailEnabled(),
        tlsRequired: isTLSEmailRequired(),
        auth: {
          username: getEmailUsername(),
          password: getEmailPassword()
        },
        logger,
        isSandboxMode
      })
      break
    case EmailTransportType.JSONEcho:
      logger.info('📧 Using JSON Echo email transporter')
      transporter = await initializeJSONEchoTransporter({ logger, isSandboxMode })
      break
    case EmailTransportType.Mailjet:
      logger.info('📧🛩️ Using Mailjet email transporter')
      transporter = await initializeMailjetTransporter({
        config: { apiKeyPublic: getEmailUsername(), apiKeyPrivate: getEmailPassword() },
        logger,
        isSandboxMode
      })
      break
    case EmailTransportType.Mailchimp:
      logger.info('📧🦜 Using Mailchimp email transporter')
      transporter = await initializeMailchimpTransporter({
        config: { apiKey: getEmailPassword() },
        logger,
        isSandboxMode
      })
      break
    default:
      throw new LogicError(unsupportedTransportTypeMessage, {
        info: { emailTransportType }
      })
  }
}

export const getTransporter = (): EmailTransport | undefined => {
  return transporter
}
