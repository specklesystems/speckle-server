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
}

export type SentEmailInfo = {
  messageId: string
}

export type EmailTransport = {
  sendMail: (options: EmailOptions) => Promise<SentEmailInfo>
}
