import { BaseError } from '@/modules/shared/errors'

export class UnknownFunctionTemplateError extends BaseError {
  static defaultMessage = 'Unknown function template'
  static code = 'UNKNOWN_FUNCTION_TEMPLATE'
  static statusCode = 400
}
