import { BaseError } from '@/modules/shared/errors/base'

export class FunctionRunNotFoundError extends BaseError {
  static defaultMessage = 'Could not find function run with given id'
  static code = 'FUNCTION_RUN_NOT_FOUND'
}

export class FunctionRunReportStatusError extends BaseError {
  static defaultMessage =
    'An error occurred while updating function run report statuses'
  static code = 'FUNCTION_RUN_REPORT_STATUSES_ERROR'
}

export class TriggerAutomationError extends BaseError {
  static defaultMessage = 'Error triggering automation'
  static code = 'TRIGGER_AUTOMATION_ERROR'
}
