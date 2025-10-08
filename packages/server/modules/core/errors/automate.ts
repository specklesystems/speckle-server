import { BaseError } from '@/modules/shared/errors/base'

export class AutomateModuleDisabledError extends BaseError {
  static defaultMessage = 'Automate is not enabled on this server'
  static code = 'AUTOMATE_MODULE_DISABLED_ERROR'
  static statusCode = 403
}
