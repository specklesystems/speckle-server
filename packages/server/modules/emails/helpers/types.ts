export type EmailBody = {
  text: string
  mjml: string
}

export type CallToAction = {
  title: string
  url: string
  altTitle?: string
}

export type EmailInput = {
  from?: string
  to: string
  subject: string
  text: string
  html: string
}
