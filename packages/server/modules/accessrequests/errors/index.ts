import { BaseError } from '@/modules/shared/errors'

export class AccessRequestProcessingError extends BaseError {
  static defaultMessage =
    'An unexpected error occurred while processing an access request'
  static code = 'ACCESS_REQUEST_PROCESSING_ERROR'
  static statusCode = 400
}

export class AccessRequestCreationError extends BaseError {
  static defaultMessage =
    'An unexpected error occurred while creating an access request'
  static code = 'ACCESS_REQUEST_CREATION_ERROR'
  static statusCode = 400
}
