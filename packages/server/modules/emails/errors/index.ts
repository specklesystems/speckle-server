import { BaseError } from '@/modules/shared/errors'

export class EmailVerificationRequestError extends BaseError {
  static code = 'EMAIL_VERIFICATION_REQUEST_ERROR'
  static defaultMessage = 'Invalid email verification request'
}

export class EmailVerificationFinalizationError extends BaseError {
  static code = 'EMAIL_VERIFICATION_FINALIZATION_ERROR'
  static defaultMessage = 'Invalid email verification finalization request'
}
