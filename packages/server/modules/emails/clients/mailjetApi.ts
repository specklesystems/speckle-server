import type { EmailTransport } from '@/modules/emails/domain/types'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import {
  getEmailPassword,
  getEmailUsername,
  isEmailSandboxMode
} from '@/modules/shared/helpers/envHelper'
import type { Logger } from '@/observability/logging'
import { ensureError } from '@speckle/shared'
import Mailjet, { type Client as MailjetClient } from 'node-mailjet'
import { z } from 'zod'
import { EmailSendingError } from '@/modules/emails/errors'

let transporter: EmailTransport | undefined = undefined

const initMailjetAPI = async (): Promise<MailjetClient> => {
  const mailjetTransporter = Mailjet.Client.apiConnect(
    getEmailUsername(),
    getEmailPassword()
  )
  return mailjetTransporter
}

const sendMessageResponseSchema = z.object({
  Messages: z.array(
    z.object({
      MessageID: z.string()
    })
  )
})

export async function initializeMailjetTransporter(deps: {
  logger: Logger
}): Promise<EmailTransport | undefined> {
  let newTransporter: MailjetClient | undefined = undefined

  const errorMessage =
    '📧 Email provider is enabled but transport has not initialized correctly. Please review the email configuration or your email system for problems.'
  try {
    newTransporter = await initMailjetAPI()
  } catch (e) {
    const err = ensureError(e, 'Unknown error while initializing Mailjet transporter')
    deps.logger.error(err, errorMessage)
    throw new MisconfiguredEnvironmentError(errorMessage, { cause: err })
  }

  if (!newTransporter) {
    deps.logger.error(errorMessage)
    throw new MisconfiguredEnvironmentError(errorMessage)
  }

  // we wrap the mailjet client in our EmailTransport interface
  transporter = {
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
            HTMLPart: options.html
          }
        ],
        SandboxMode: isEmailSandboxMode()
      })

      // validate response is as expected
      const parsedResponse = await sendMessageResponseSchema.safeParseAsync(
        response.body
      )
      if (!parsedResponse.success || parsedResponse.data.Messages.length === 0) {
        throw new EmailSendingError('No messages were sent')
      }

      return { messageId: parsedResponse.data.Messages[0].MessageID }
    }
  }
  return transporter
}

export function getTransporter(): EmailTransport | undefined {
  return transporter
}
