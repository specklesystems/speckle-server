import { BaseError } from '@/modules/shared/errors/base'

export class WorkspacesModuleDisabledError extends BaseError {
  static defaultMessage = 'Workspaces are not enabled on this server'
  static code = 'WORKSPACES_MODULE_DISABLED_ERROR'
  static statusCode = 403
}
