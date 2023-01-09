import { BaseError } from '@/modules/shared/errors'

export class BranchNameError extends BaseError {
  static defaultMessage = "There's an issue with the branch name"
  static code = 'BRANCH_NAME_ERROR'
}
