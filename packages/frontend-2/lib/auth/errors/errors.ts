import { BaseError } from '~~/lib/core/errors/base'

export class InvalidLoginParametersError extends BaseError {
  static defaultMessage = 'Invalid parameters for logging in!'
}

export class AuthFailedError extends BaseError {
  static defaultMessage = 'Logging in failed!'
}

export class InvalidRegisterParametersError extends BaseError {
  static defaultMessage = 'Invalid parameters for signing up!'
}
