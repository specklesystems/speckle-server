import { BaseError } from '~~/lib/core/errors/base'

export class InvalidLoginParametersError extends BaseError {
  static defaultMessage = 'Invalid parameters for logging int!'
}

export class LoginFailedError extends BaseError {
  static defaultMessage = 'Logging in failed!'
}

export class AuthStateRuntimeError extends BaseError {
  static defaultMessage = 'Unexpected issue while working with the apps auth state!'
}
