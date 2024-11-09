import { BaseError } from '@/modules/shared/errors/base'

export class AutomateApiDisabledError extends BaseError {
  static defaultMessage = 'Automate module is disabled'
  static code = 'AUTOMATE_API_DISABLED'
  static statusCode = 423
}
