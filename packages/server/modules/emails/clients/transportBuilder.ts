import type { EmailTransport } from '@/modules/emails/domain/types'
import type { Logger } from '@/observability/logging'
import { initializeSMTPTransporter } from '@/modules/emails/clients/smtp'
import { initializeJSONEchoTransporter } from '@/modules/emails/clients/jsonEcho'
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
  isSandboxMode: boolean
  logger: Logger
}) => {
  const { isSandboxMode, logger } = params

  if (params.isSandboxMode) {
    logger.info('📧 Using JSON Echo email transporter')
    transporter = await initializeJSONEchoTransporter({ logger, isSandboxMode })
  } else {
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
  }
}

export const getTransporter = (): EmailTransport | undefined => {
  return transporter
}
