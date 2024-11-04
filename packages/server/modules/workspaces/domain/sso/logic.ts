import { UserSsoSessionRecord } from '@/modules/workspaces/domain/sso/types'

/**
 * Get the default expiration time for an SSO session based on the current time.
 * TODO: Is 7 days a good default session length?
 */
export const getDefaultSsoSessionExpirationDate = (): Date => {
  const now = new Date()
  now.setDate(now.getDate() + 7)
  return now
}

export const isValidSsoSession = (session: UserSsoSessionRecord): boolean => {
  return session.validUntil.getTime() > new Date().getTime()
}
