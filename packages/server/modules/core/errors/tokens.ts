import { BaseError } from '@/modules/shared/errors'

export class TokenRevokationError extends BaseError {
  static code = 'TOKEN_REVOKATION_ERROR'
  static defaultMessage = 'Token revokation failed'
  static statusCode = 400
}
