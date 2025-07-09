import type Mail from 'nodemailer/lib/mailer'

export const emailsEventNamespace = 'emails' as const

export const EmailsEvents = {
  Sent: `${emailsEventNamespace}.sent`,
  PreparingToSend: `${emailsEventNamespace}.preparingToSend`
} as const
export type EmailsEvents = (typeof EmailsEvents)[keyof typeof EmailsEvents]

export type EmailsEventsPayloads = {
  [EmailsEvents.Sent]: { options: Mail.Options }
  [EmailsEvents.PreparingToSend]: { options: Omit<Mail.Options, 'from'> }
}
