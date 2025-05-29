import { blockedDomains } from '@speckle/shared'

export const checkIfEmailIsBlocked = (email?: string) => {
  if (!email) return false

  const domain = email.split('@')[1]
  return blockedDomains.includes(domain)
}
