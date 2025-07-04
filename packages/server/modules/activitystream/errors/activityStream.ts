import { BaseError } from '@/modules/shared/errors'

export class InvalidActionTypeError extends BaseError {
  static defaultMessage = 'Invalid action type'
  static code = 'INVALID_ACTION_TYPE'
  static statusCode = 400
}

export class MaxBackfillIterations extends BaseError {
  static defaultMessage = 'Max backfill iterations reached'
  static code = 'MAX_BACKFILL_ITERATIONS'
  static statusCode = 400
}
