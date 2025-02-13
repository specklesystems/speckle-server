import { BaseError } from '@/modules/shared/errors/base'

export class CookieParserError extends BaseError {
  static defaultMessage = 'Error parsing cookies'
  static code = 'COOKIE_PARSER_ERROR'
  static statusCode = 400
}
