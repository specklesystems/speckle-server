import { BaseError } from '@/modules/shared/errors'

export class ObjectHandlingError extends BaseError {
  static defaultMessage = 'Failed to handle object.'
  static code = 'OBJECT_HANDLING_ERROR'
  static statusCode = 400
}
