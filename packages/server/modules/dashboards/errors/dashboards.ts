import { BaseError } from '@/modules/shared/errors'

export class AccModuleDisabledError extends BaseError {
  static defaultMessage = 'ACC integration module is disabled'
  static code = 'ACC_MODULE_DISABLED'
  static statusCode = 423
}

export class DashboardsModuleDisabledError extends BaseError {
  static defaultMessage = 'Dashboards module is disabled'
  static code = 'DASHBOARDS_MODULE_DISABLED'
  static statusCode = 423
}

export class DashboardNotFoundError extends BaseError {
  static defaultMessage = 'Dashboard not found'
  static code = 'DASHBOARDS_NOT_FOUND'
  static statusCode = 404
}
