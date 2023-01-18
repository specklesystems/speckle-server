import { BaseError } from '@/modules/shared/errors'

export class BranchNameError extends BaseError {
  static defaultMessage = "There's an issue with the branch name"
  static code = 'BRANCH_NAME_ERROR'
}

export class BranchCreateError extends BaseError {
  static defaultMessage = 'An issue occurred while creating a branch'
  static code = 'BRANCH_CREATE_ERROR'
}

export class BranchUpdateError extends BaseError {
  static defaultMessage = 'An issue occured while updating a branch'
  static code = 'BRANCH_UPDATE_ERROR'
}

export class BranchDeleteError extends BaseError {
  static defaultMessage = 'An issue occured while deleting a branch'
  static code = 'BRANCH_DELETE_ERROR'
}
