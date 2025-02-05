import { BaseError } from '@/modules/shared/errors'

export class InvalidPasswordRecoveryRequestError extends BaseError {
  static code = 'INVALID_PASSWORD_RECOVERY_REQUEST_ERROR'
  static defaultMessage = 'Invalid password recovery request'
  static statusCode = 400
}

export class PasswordRecoveryFinalizationError extends BaseError {
  static code = 'PASSWORD_RECOVERY_FINALIZATION_ERROR'
  static defaultMessage = 'An error occurred while finalizing the password change'
  static statusCode = 400
}
