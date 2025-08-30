import { BaseError } from '@/modules/shared/errors'

export class DashboardsModuleDisabledError extends BaseError {
  static defaultMessage = 'Dashboards module is disabled'
  static code = 'DASHBOARDS_MODULE_DISABLED'
  static statusCode = 423
}

export class DashboardsNotYetImplementedError extends BaseError {
  static defaultMessage = 'This dashboards feature is not yet implemented'
  static code = 'DASHBOARDS_NOT_YET_IMPLEMENTED'
  static statusCode = 501
}

export class DashboardNotFoundError extends BaseError {
  static defaultMessage = 'Dashboard not found'
  static code = 'DASHBOARDS_NOT_FOUND'
  static statusCode = 404
}

export class DashboardMalformedTokenError extends BaseError {
  static defaultMessage =
    'Dashboard not associated with any projects. Cannot create token.'
  static code = 'DASHBOARDS_MALFORMED_TOKEN'
  static statusCode = 422
}
