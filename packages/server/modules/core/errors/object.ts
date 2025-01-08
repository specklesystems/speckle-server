import { BaseError } from '@/modules/shared/errors'

export class ObjectHandlingError extends BaseError {
  static defaultMessage = 'Failed to handle object.'
  static code = 'OBJECT_HANDLING_ERROR'
  static statusCode = 400
}

export class ObjectNotFoundError extends BaseError {
  static defaultMessage = 'Object not found.'
  static code = 'OBJECT_NOT_FOUND'
  static statusCode = 404
}
