import { BaseError } from '@/modules/shared/errors'

export class InvalidLicenseError extends BaseError {
  static defaultMessage = 'Invalid license'
  static code = 'INVALID_LICENSE'
  static statusCode = 400
}
