import { BaseError } from '~~/lib/core/errors/base'

export class InvalidLoginParametersError extends BaseError {
  static override defaultMessage = 'Invalid parameters for logging in!'
}

export class AuthFailedError extends BaseError {
  static override defaultMessage = 'Logging in failed!'
}

export class InvalidRegisterParametersError extends BaseError {
  static override defaultMessage = 'Invalid parameters for signing up!'
}

export class PasswordResetError extends BaseError {
  static override defaultMessage = 'Something went wrong while resetting password'
}

export class OnboardingError extends BaseError {
  static override defaultMessage = 'Something went wrong while onboarding the user'
}
