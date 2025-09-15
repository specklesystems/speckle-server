import { createTransport } from 'nodemailer'
import type { EmailTransport } from '@/modules/emails/domain/types'
import type { Logger } from '@/observability/logging'
import { EmailTransportInitializationError } from '@/modules/emails/errors'
import type { SentMessageInfo } from 'nodemailer/lib/json-transport'
import { SentEmailDeliveryStatus } from '@/modules/emails/domain/consts'

const createJsonEchoTransporter = () => {
  const newTransport = createTransport({ jsonTransport: true })
  const wrappedTransporter: EmailTransport = {
    sendMail: async (options) => {
      const response = await newTransport.sendMail(options)

      return {
        messageId: response.messageId,
        status: mapJsonResponseToSentEmailDeliveryStatus(response)
      }
    }
  }

  return wrappedTransporter
}

export async function initializeJSONEchoTransporter(deps: {
  isSandboxMode: boolean
  logger: Logger
}): Promise<EmailTransport | undefined> {
  let newTransporter = undefined

  newTransporter = createJsonEchoTransporter()
  if (!newTransporter) {
    const message =
      '📧 In testing or email sandbox mode a mock email provider is enabled but transport has not initialized correctly.'
    deps.logger.error(message)
    throw new EmailTransportInitializationError(message)
  }

  return newTransporter
}

export const mapJsonResponseToSentEmailDeliveryStatus = (
  response: SentMessageInfo
): SentEmailDeliveryStatus => {
  if (response.rejected.length > 0) {
    return SentEmailDeliveryStatus.FAILED
  }

  if (response.accepted.length === 0) {
    return SentEmailDeliveryStatus.PENDING
  }

  return SentEmailDeliveryStatus.SENT
}
