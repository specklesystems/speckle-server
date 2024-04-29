import { BaseError } from '@/modules/shared/errors/base'

export class FunctionRunReportStatusesError extends BaseError {
  static defaultMessage =
    'An error occurred while updating function run report statuses'
  static code = 'FUNCTION_RUN_REPORT_STATUSES_ERROR'
}
