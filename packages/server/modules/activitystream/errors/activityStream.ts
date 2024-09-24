import { BaseError } from '@/modules/shared/errors'

export class InvalidActionTypeError extends BaseError {
  static defaultMessage = 'Invalid action type'
  static code = 'INVALID_ACTION_TYPE'
  static statusCode = 400
}
