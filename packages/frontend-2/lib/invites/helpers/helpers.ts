import { isValidEmail } from '~/lib/invites/helpers/validation'

export const parsePastedEmails = (pastedText: string) => {
  const emails = pastedText
    .split(/[\s,;]+/)
    .map((email) => email.trim())
    .filter((email) => email.length > 0)
    .filter((email) => isValidEmail(email))

  return emails
}
