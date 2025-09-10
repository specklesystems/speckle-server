import type { EmailTransport } from '@/modules/emails/domain/types'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import type { Logger } from '@/observability/logging'
import { ensureError } from '@speckle/shared'
import Mailjet, { type Client as MailjetClient } from 'node-mailjet'
import { z } from 'zod'
import { EmailSendingError } from '@/modules/emails/errors'

const initMailjetAPI = async (params: {
  apiKeyPublic: string
  apiKeyPrivate: string
}): Promise<MailjetClient> => {
  const mailjetTransporter = Mailjet.Client.apiConnect(
    params.apiKeyPublic,
    params.apiKeyPrivate
  )
  return mailjetTransporter
}

const sendMessageResponseSchema = z.object({
  Messages: z.array(
    z.object({
      MessageID: z.string().optional(),
      CustomId: z.string().optional()
    })
  )
})

export async function initializeMailjetTransporter(params: {
  config: {
    apiKeyPublic: string
    apiKeyPrivate: string
  }
  logger: Logger
  isSandboxMode: boolean
}): Promise<EmailTransport | undefined> {
  let newTransporter: MailjetClient | undefined = undefined

  const errorMessage =
    '📧 Email provider is enabled but transport has not initialized correctly. Please review the email configuration or your email system for problems.'
  try {
    newTransporter = await initMailjetAPI({
      apiKeyPublic: params.config.apiKeyPublic,
      apiKeyPrivate: params.config.apiKeyPrivate
    })
  } catch (e) {
    const err = ensureError(e, 'Unknown error while initializing Mailjet transporter')
    params.logger.error(err, errorMessage)
    throw new MisconfiguredEnvironmentError(errorMessage, { cause: err })
  }

  if (!newTransporter) {
    params.logger.error(errorMessage)
    throw new MisconfiguredEnvironmentError(errorMessage)
  }

  // we wrap the mailjet client in our EmailTransport interface
  const transporter: EmailTransport = {
    sendMail: async (options) => {
      const response = await newTransporter.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: {
              Email: options.from
            },
            To: Array.isArray(options.to)
              ? options.to.map((email) => ({ Email: email }))
              : [{ Email: options.to }],
            Subject: options.subject,
            TextPart: options.text,
            HTMLPart: options.html,
            CustomID: options.speckleEmailId
          }
        ],
        SandboxMode: params.isSandboxMode
      })

      // validate response is as expected
      const parsedResponse = await sendMessageResponseSchema.safeParseAsync(
        response.response.data
      )
      if (!parsedResponse.success || parsedResponse.data.Messages.length === 0) {
        throw new EmailSendingError('No messages were sent')
      }

      return {
        messageId:
          parsedResponse.data.Messages[0].MessageID ||
          parsedResponse.data.Messages[0].CustomId ||
          ''
      }
    }
  }
  return transporter
}
