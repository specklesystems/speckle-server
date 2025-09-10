import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { createTransport } from 'nodemailer'
import type { EmailTransport } from '@/modules/emails/domain/types'
import type { Logger } from '@/observability/logging'

const createJsonEchoTransporter = () => createTransport({ jsonTransport: true })

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
    throw new MisconfiguredEnvironmentError(message)
  }

  return newTransporter
}
