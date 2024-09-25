import { BaseError } from '@/modules/shared/errors'

export class InvalidAccessCodeRequestError extends BaseError {
  static code = 'INVALID_ACCESS_CODE_REQUEST'
  static defaultMessage = 'An issue occurred while generating an access code for an app'
  static statusCode = 400
}
