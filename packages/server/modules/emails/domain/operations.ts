import { UserRecord } from '@/modules/core/helpers/types'
import { EmailVerificationRecord } from '@/modules/emails/repositories'

/**
 * Repositories
 */

export type GetPendingToken = (params: {
  token?: string
  email?: string
}) => Promise<EmailVerificationRecord | undefined>

export type DeleteVerifications = (email: string) => Promise<void>

export type DeleteOldAndInsertNewVerification = (email: string) => Promise<string>

/**
 * Services
 */

export type RequestNewEmailVerification = (emailId: string) => Promise<void>

export type RequestEmailVerification = (userId: string) => Promise<void>

export type SendEmailParams = {
  from?: string
  to: string | string[]
  subject: string
  text: string
  html: string
}
export type SendEmail = (args: SendEmailParams) => Promise<boolean>

export type EmailTemplateServerInfo = {
  name: string
  canonicalUrl: string
  company: string
  adminContact: string
}

export type EmailCta = {
  title: string
  url: string
}

export type EmailBody = {
  text: string
  mjml: string
}

export type EmailInput = {
  from?: string
  to: string
  subject: string
  text: string
  html: string
}

export type EmailContent = {
  text: string
  html: string
}

export type EmailTemplateParams = {
  mjml: { bodyStart: string; bodyEnd?: string }
  text: { bodyStart: string; bodyEnd?: string }
  cta?: {
    url: string
    title: string
    altTitle?: string
  }
}

export type RenderEmail = (
  templateParams: EmailTemplateParams,
  serverInfo: EmailTemplateServerInfo,
  user: UserRecord | null
) => Promise<EmailContent>
