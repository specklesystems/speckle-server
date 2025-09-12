export const EmailTransportType = {
  SMTP: 'smtp',
  JSONEcho: 'jsonecho',
  Mailjet: 'mailjet',
  Mailchimp: 'mailchimp'
} as const
export type EmailTransportType =
  (typeof EmailTransportType)[keyof typeof EmailTransportType]

export const isEmailTransportType = (value: string): value is EmailTransportType => {
  return Object.values(EmailTransportType).includes(value as EmailTransportType)
}
