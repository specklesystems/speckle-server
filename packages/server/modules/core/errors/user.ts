import { BaseError } from '@/modules/shared/errors/base'

export class UserUpdateError extends BaseError {
  static defaultMessage = 'An issue occurred while attempting to update a user'
  static code = 'USER_UPDATE_ERROR'
}

export class UserValidationError extends BaseError {
  static defaultMessage = 'The user input data is invalid'
  static code = 'USER_VALIDATION_ERROR'
}
