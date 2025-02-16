import {
  OidcProfile,
  UserSsoSessionRecord
} from '@/modules/workspaces/domain/sso/types'
import { UnknownObject, UserinfoResponse } from 'openid-client'

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

export const isValidOidcProfile = (
  profile: UserinfoResponse<UnknownObject, UnknownObject>
): profile is OidcProfile => {
  return !!profile.email || !!profile.upn
}

/**
 * Special handling required in case we encounter Entra ID with a particular configuration.
 */
export const getEmailFromOidcProfile = (profile: OidcProfile): string => {
  return 'email' in profile ? profile.email : profile.upn
}
