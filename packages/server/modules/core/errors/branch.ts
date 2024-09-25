import { BaseError } from '@/modules/shared/errors'

export class BranchNameError extends BaseError {
  static defaultMessage = "There's an issue with the branch name"
  static code = 'BRANCH_NAME_ERROR'
  static statusCode = 400
}

export class BranchCreateError extends BaseError {
  static defaultMessage = 'An issue occurred while creating a branch'
  static code = 'BRANCH_CREATE_ERROR'
  static statusCode = 400
}

export class BranchUpdateError extends BaseError {
  static defaultMessage = 'An issue occured while updating a branch'
  static code = 'BRANCH_UPDATE_ERROR'
  static statusCode = 400
}

export class BranchDeleteError extends BaseError {
  static defaultMessage = 'An issue occured while deleting a branch'
  static code = 'BRANCH_DELETE_ERROR'
  static statusCode = 400
}

export class BranchNotFoundError extends BaseError {
  static defaultMessage = 'Attempting to work with a non-existant branch'
  static code = 'BRANCH_NOT_FOUND'
  static statusCode = 404
}
