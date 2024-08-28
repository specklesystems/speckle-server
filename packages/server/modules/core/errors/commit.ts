import { BaseError } from '@/modules/shared/errors'

export class CommitInvalidAccessError extends BaseError {
  static defaultMessage = 'User does not have access to the specified commit'
  static code = 'COMMIT_INVALID_ACCESS_ERROR'
}

export class CommitBatchUpdateError extends BaseError {
  static defaultMessage = 'An issue occurred while batch updating commits'
  static code = 'COMMIT_BATCH_UPDATE_ERROR'
}

export class CommitCreateError extends BaseError {
  static defaultMessage = 'An issue occured while creating a commit'
  static code = 'COMMIT_CREATE_ERROR'
}

export class CommitReceiveError extends BaseError {
  static defaultMessage = 'An issue occurred while receiving a commit'
  static code = 'COMMIT_RECEIVE_ERROR'
}

export class CommitUpdateError extends BaseError {
  static defaultMessage = 'An issue occurred while updating a commit'
  static code = 'COMMIT_UPDATE_ERROR'
}

export class CommitDeleteError extends BaseError {
  static defaultMessage = 'An issue occurred while deleting a commit'
  static code = 'COMMIT_DELETE_ERROR'
}

export class CommitNotFoundError extends BaseError {
  static defaultMessage = 'Attempting to work with a non-existant commit'
  static code = 'COMMIT_NOT_FOUND'
}
