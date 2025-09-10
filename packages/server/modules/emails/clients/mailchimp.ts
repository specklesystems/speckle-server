import Mailchimp from '@mailchimp/mailchimp_transactional'
import type { EmailTransport } from '@/modules/emails/domain/types'
import type { Logger } from '@/observability/logging'
import { ensureError } from '@speckle/shared'
import { z } from 'zod'
import { EmailSendingError, MailchimpClientError } from '@/modules/emails/errors'

const initMailchimpTransactionalAPI = async (params: {
  apiKey: string
}): Promise<Mailchimp.ApiClient> => {
  const mailchimpTransporter = Mailchimp(params.apiKey)

  // test the connection by pinging the service
  const response = await mailchimpTransporter.users.ping()
  if (response !== 'PONG!') {
    throw new MailchimpClientError('Unexpected response from Mailchimp API ping')
  }

  return mailchimpTransporter
}

const sendMessageResponseSchema = z.array(
  z.object({
    _id: z.string()
  })
)

export async function initializeMailchimpTransporter(deps: {
  config: {
    apiKey: string
  }
  logger: Logger
  isSandboxMode: boolean
}): Promise<EmailTransport | undefined> {
  let newTransporter: Mailchimp.ApiClient | undefined = undefined

  const errorMessage =
    '📧 Email provider is enabled but transport has not initialized correctly. Please review the email configuration or your email system for problems.'
  try {
    newTransporter = await initMailchimpTransactionalAPI({ apiKey: deps.config.apiKey })
  } catch (e) {
    const err = ensureError(e, 'Unknown error while initializing Mailchimp transporter')
    deps.logger.error(err, errorMessage)
    throw new MailchimpClientError(errorMessage, { cause: err })
  }

  if (!newTransporter) {
    deps.logger.error(errorMessage)
    throw new MailchimpClientError(errorMessage)
  }

  // we wrap the mailjet client in our EmailTransport interface
  const transporter: EmailTransport = {
    sendMail: async (options) => {
      const message = {
        // eslint-disable-next-line camelcase
        from_email: options.from,
        // eslint-disable-next-line camelcase
        from_name: 'Speckle',
        subject: options.subject,
        text: options.text,
        html: options.html,
        to: Array.isArray(options.to)
          ? options.to.map((email) => ({ email }))
          : [{ email: options.to }]
      }
      const response = await newTransporter.messages.send({ message })

      // validate response is as expected
      const parsedResponse = await sendMessageResponseSchema.safeParseAsync(response)
      if (!parsedResponse.success || parsedResponse.data.length === 0) {
        throw new EmailSendingError('No messages were sent')
      }

      return {
        messageId: parsedResponse.data[0]._id
      }
    }
  }
  return transporter
}
