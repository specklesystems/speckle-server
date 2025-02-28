import { UserEmail } from '@/modules/core/domain/userEmails/types'
import { User } from '@/modules/core/domain/users/types'
import { BaseError } from '@/modules/shared/errors/base'

export class SsoSessionMissingOrExpiredError extends BaseError {
  static defaultMessage =
    'No valid SSO session found for the given workspace. Please sign in.'
  static code = 'SSO_SESSION_MISSING_OR_EXPIRED_ERROR'
  static statusCode = 401
}

export class SsoVerificationCodeMissingError extends BaseError {
  static defaultMessage = 'Cannot find verification token. Restart authentication flow.'
  static code = 'SSO_VERIFICATION_CODE_MISSING_ERROR'
}

export class SsoProviderTypeNotSupportedError extends BaseError {
  static defaultMessage = 'SSO provider type not supported.'
  static code = 'SSO_PROVIDER_TYPE_NOT_SUPPORTED'
  static statusCode = 500
}

export class SsoProviderExistsError extends BaseError {
  static defaultMessage =
    'SSO provider already configured for workspace. Delete it to reconfigure.'
  static code = 'SSO_PROVIDER_EXISTS_ERROR'
}

export class SsoProviderMissingError extends BaseError {
  static defaultMessage = 'No SSO provider registered for the given workspace.'
  static code = 'SSO_PROVIDER_MISSING_ERROR'
}

export class SsoProviderProfileMissingError extends BaseError {
  static defaultMessage = 'Failed to get user profile from SSO provider.'
  static code = 'SSO_PROVIDER_PROFILE_MISSING_ERROR'
}

export class SsoProviderProfileMissingPropertiesError extends BaseError {
  static code = 'SSO_PROVIDER_PROFILE_MISSING_PROPERTIES_ERROR'
  constructor(properties: string[]) {
    super(
      [
        'Login was successful, but your identity provider is not configured correctly for Speckle.',
        'The following required properties were not present on your user profile:',
        properties.join(', ')
      ].join(' ')
    )
  }
}

export class SsoProviderProfileInvalidError extends BaseError {
  static defaultMessage = 'SSO provider user profile is invalid.'
  static code = 'SSO_PROVIDER_PROFILE_INVALID_ERROR'
}

export class SsoGenericAuthenticationError extends BaseError {
  static defaultMessage = 'Unhandled failure signing in with SSO.'
  static code = 'SSO_GENERIC_AUTHENTICATION_ERROR'
}

export class SsoGenericProviderValidationError extends BaseError {
  static defaultMessage = 'Unhandled failure configuring SSo for the given workspace.'
  static code = 'SSO_GENERIC_PROVIDER_VALIDATION_ERROR'
}

export class SsoUserEmailUnverifiedError extends BaseError {
  static defaultMessage = 'Cannot sign in with SSO using unverified email.'
  static code = 'SSO_USER_EMAIL_UNVERIFIED_ERROR'
}

export class SsoUserClaimedError extends BaseError {
  static defaultMessage =
    'OIDC provider user already associated with another Speckle account.'
  static code = 'SSO_USER_ALREADY_CLAIMED_ERROR'
  constructor(params: {
    currentUser: User
    currentUserEmails: UserEmail[]
    existingUser: User
    existingUserEmail: string
  }) {
    super(
      [
        'User from SSO provider already exists as another Speckle user.',
        `Currently signed in as ${params.currentUser.name}`,
        `(${params.currentUserEmails.map((record) => record.email).join(',')})`,
        `but attempted to sign in as ${params.existingUser.name}`,
        `(${params.existingUserEmail})`
      ].join(' ')
    )
  }
}

export class SsoUserInviteRequiredError extends BaseError {
  static defaultMessage = 'Cannot sign up with SSO without a valid workspace invite.'
  static code = 'SSO_USER_INVITE_REQUIRED_ERROR'
  static statusCode = 400
}

export class OidcProviderMissingGrantTypeError extends BaseError {
  static defaultMessage = 'OIDC issuer does not support authorization_code grant type'
  static code = 'SSO_OIDC_PROVIDER_MISSING_GRANT_TYPE'
  static statusCode = 400
}

export class OidcStateInvalidError extends BaseError {
  static defaultMessage = 'OIDC state information malformed or invalid.'
  static code = 'SSO_OIDC_STATE_INVALID'
}

export class OidcStateMissingError extends BaseError {
  static defaultMessage = 'OIDC state missing for specified session.'
  static code = 'SSO_OIDC_STATE_MISSING'
}
