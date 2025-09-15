import type { SentEmailDeliveryStatus } from '@/modules/emails/domain/consts'

export type EmailVerification = {
  id: string
  email: string
  createdAt: Date
  code: string
}

export type EmailOptions = {
  from?: string
  to: string | string[]
  subject: string
  text: string
  html: string
  speckleEmailId?: string
}

export type SentEmailRecipientStatus = {
  email: string
  emailStatus: SentEmailDeliveryStatus
}

export type SentEmailInfo = {
  messageId: string
  /**
   * Overall status for the email. If multiple recipients were specified, this will be the "worst" status among them.
   * For example, if one recipient's email was sent successfully but another's failed, the overall status will be "failed".
   */
  status: SentEmailDeliveryStatus
  errorMessages?: string[]
}

export type EmailTransport = {
  sendMail: (options: EmailOptions) => Promise<SentEmailInfo>
}
