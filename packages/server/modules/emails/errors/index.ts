import { BaseError } from '@/modules/shared/errors'

export class EmailVerificationRequestError extends BaseError {
  static code = 'EMAIL_VERIFICATION_REQUEST_ERROR'
  static defaultMessage = 'Invalid email verification request'
  static statusCode = 400
}

export class EmailVerificationFinalizationError extends BaseError {
  static code = 'EMAIL_VERIFICATION_FINALIZATION_ERROR'
  static defaultMessage = 'Invalid email verification finalization request'
  static statusCode = 400
}

export class EmailSendingError extends BaseError {
  static code = 'EMAIL_SENDING_ERROR'
  static defaultMessage = 'Error sending email'
  static statusCode = 500
}

export class EmailTransportInitializationError extends BaseError {
  static code = 'EMAIL_TRANSPORT_INITIALIZATION_ERROR'
  static defaultMessage = 'Error initializing email transport'
  static statusCode = 500
}

export class MailchimpClientError extends BaseError {
  static code = 'MAILCHIMP_CLIENT_ERROR'
  static defaultMessage = 'Error with Mailchimp client'
  static statusCode = 500
}
