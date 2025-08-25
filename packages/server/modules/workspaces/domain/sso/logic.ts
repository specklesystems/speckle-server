import type {
  OidcProfile,
  SpeckleOidcProfile,
  UserSsoSessionRecord
} from '@/modules/workspaces/domain/sso/types'
import type { UnknownObject, UserinfoResponse } from 'openid-client'

/**
 * Get the default expiration time for an SSO session based on the current time.
 * TODO: Is 7 days a good default session length?
 */
export const getDefaultSsoSessionExpirationDate = (days = 7): Date => {
  const now = new Date()
  now.setDate(now.getDate() + days)
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

const isSpeckleOidcProfile = (
  profile: OidcProfile
): profile is OidcProfile<SpeckleOidcProfile> => {
  return Object.hasOwn(profile, 'email')
}

/**
 * Special handling required in case we encounter Entra ID with a particular configuration.
 */
export const getEmailFromOidcProfile = (profile: OidcProfile): string => {
  return isSpeckleOidcProfile(profile) ? profile.email : profile.upn
}
