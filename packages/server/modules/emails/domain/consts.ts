export const EmailTransportType = {
  SMTP: 'smtp',
  JSONEcho: 'jsonecho'
} as const
export type EmailTransportType =
  (typeof EmailTransportType)[keyof typeof EmailTransportType]

export const isEmailTransportType = (value: string): value is EmailTransportType => {
  return Object.values(EmailTransportType).includes(value as EmailTransportType)
}

export const SentEmailDeliveryStatus = {
  QUEUED: 'queued',
  PENDING: 'pending', // addresses that received a temporary failure response from the receiving server
  SENT: 'sent',
  FAILED: 'failed'
} as const

export type SentEmailDeliveryStatus =
  (typeof SentEmailDeliveryStatus)[keyof typeof SentEmailDeliveryStatus]
