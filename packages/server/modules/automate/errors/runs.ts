import { BaseError } from '@/modules/shared/errors/base'

export class FunctionRunNotFoundError extends BaseError {
  static defaultMessage = 'Could not find function run with given id'
  static code = 'FUNCTION_RUN_NOT_FOUND'
  static statusCode = 404
}

export class FunctionRunReportStatusError extends BaseError {
  static defaultMessage =
    'An error occurred while updating function run report statuses'
  static code = 'FUNCTION_RUN_REPORT_STATUSES_ERROR'
  static statusCode = 400
}

export class TriggerAutomationError extends BaseError {
  static defaultMessage = 'Error triggering automation'
  static code = 'TRIGGER_AUTOMATION_ERROR'
  static statusCode = 400
}
