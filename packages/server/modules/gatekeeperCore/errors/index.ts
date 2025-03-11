import { BaseError } from '@/modules/shared/errors'

export class GatekeeperModuleDisabledError extends BaseError {
  static defaultMessage = 'Gatekeeper module is not enabled on this server'
  static code = 'GATEKEEPER_MODULE_DISABLED_ERROR'
  static statusCode = 403
}
