import type { Info } from '@/modules/shared/errors'
import { BaseError } from '@/modules/shared/errors'
import type { Options } from 'verror'

export class UserInputError<I extends Info = Info> extends BaseError<I> {
  static defaultMessage = 'Invalid user input.'
  static code = 'USER_INPUT_ERROR'
  static statusCode = 400
}

export class PasswordTooShortError extends UserInputError {
  constructor(minPasswordLength: number, options?: Options | Error) {
    super(
      `Password too short; needs to be ${minPasswordLength} characters or longer.`,
      options
    )
  }
}

interface UnverifiedEmailSSOLoginErrorInfo {
  email: string
}

export class UnverifiedEmailSSOLoginError extends UserInputError<UnverifiedEmailSSOLoginErrorInfo> {
  static defaultMessage =
    'Email already in use by a user with unverified email. Verify the email on the existing user to be able to log in with this method.'
  static code = 'UNVERIFIED_EMAIL_SSO_LOGIN_ERROR'
}

export class BlockedEmailDomainError extends UserInputError {
  static defaultMessage =
    'Please use your work email instead of a personal email address'
  static code = 'BLOCKED_EMAIL_DOMAIN_ERROR'
}
