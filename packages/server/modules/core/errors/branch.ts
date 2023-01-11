import { BaseError } from '@/modules/shared/errors'

export class BranchNameError extends BaseError {
  static defaultMessage = "There's an issue with the branch name"
  static code = 'BRANCH_NAME_ERROR'
}

export class BranchCreateError extends BaseError {
  static defaultMessage = 'An issue occurred while creating a branch'
  static code = 'BRANCH_CREATE_ERROR'
}
