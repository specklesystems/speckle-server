import { BaseError } from '@/modules/shared/errors/base'

export class UserUpdateError extends BaseError {
  static defaultMessage = 'An issue occurred while attempting to update a user'
  static code = 'USER_UPDATE_ERROR'
  static statusCode = 500
}

export class UserValidationError extends BaseError {
  static defaultMessage = 'The user input data is invalid'
  static code = 'USER_VALIDATION_ERROR'
  static statusCode = 400
}

export class TokenCreateError extends BaseError {
  static code = 'TOKEN_CREATE_ERROR'
  static defaultMessage = 'An error occurred while creating a token'
  static statusCode = 400
}
