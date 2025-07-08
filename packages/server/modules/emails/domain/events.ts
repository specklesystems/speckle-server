import type Mail from 'nodemailer/lib/mailer'

export const emailsEventNamespace = 'emails' as const

export const EmailsEvents = {
  Sent: `${emailsEventNamespace}.sent`
} as const
export type EmailsEvents = (typeof EmailsEvents)[keyof typeof EmailsEvents]

export type EmailsEventsPayloads = {
  [EmailsEvents.Sent]: Mail.Options
}
