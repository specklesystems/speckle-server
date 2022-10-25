import { BaseError } from '@/helpers/errorHelper'

export class InvalidAuthTokenError extends BaseError {
  static defaultMessage = 'Invalid auth token stored locally'
}
