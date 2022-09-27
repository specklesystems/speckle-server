import { BaseError } from '@/modules/shared/errors'

export class CommitInvalidAccessError extends BaseError {
  static defaultMessage = 'User does not have access to the specified commit'
  static code = 'COMMIT_INVALID_ACCESS_ERROR'
}

export class CommitBatchUpdateError extends BaseError {
  static defaultMessage = 'An issue occurred while batch updating commits'
  static code = 'COMMIT_BATCH_UPDATE_ERROR'
}
