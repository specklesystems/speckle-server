import type { EmailTransport } from '@/modules/emails/domain/types'
import {
  EmailTransportType,
  isEmailTransportType
} from '@/modules/emails/domain/consts'
import type { Logger } from '@/observability/logging'
import { LogicError, MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { initializeMailjetTransporter } from '@/modules/emails/clients/mailjetApi'
import { initializeSMTPTransporter } from '@/modules/emails/clients/smtpTransporter'

let transporter: EmailTransport | undefined = undefined

export const initializeEmailTransport = async (params: {
  emailTransportType: string
  isSandboxMode: boolean
  logger: Logger
}) => {
  const { emailTransportType, isSandboxMode, logger } = params
  const unsupportedTransportTypeMessage =
    'Unsupported email transporter type: {emailTransportType}'
  if (!isEmailTransportType(emailTransportType)) {
    throw new MisconfiguredEnvironmentError(unsupportedTransportTypeMessage, {
      info: { emailTransportType }
    })
  }

  switch (emailTransportType) {
    case EmailTransportType.SMTP:
      logger.info('📧 Using SMTP email transporter')
      transporter = await initializeSMTPTransporter({ logger, isSandboxMode })
      break
    case EmailTransportType.Mailjet:
      logger.info('📧🛩️ Using Mailjet email transporter')
      transporter = await initializeMailjetTransporter({ logger, isSandboxMode })
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
