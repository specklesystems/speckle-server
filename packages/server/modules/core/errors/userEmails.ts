import { BaseError } from '@/modules/shared/errors/base'

export class UserEmailDeleteError extends BaseError {
  static defaultMessage = 'An issue occurred while attempting to delete a user email'
  static code = 'USER_EMAIL_DELETE_ERROR'
  static statusCode = 400
}

export class UserEmailPrimaryAlreadyExistsError extends BaseError {
  static defaultMessage = 'A primary email already exists for this user'
  static code = 'USER_EMAIL_PRIMARY_EXISTS'
  static statusCode = 400
}

export class UserEmailAlreadyExistsError extends BaseError {
  static defaultMessage = 'Email already exists'
  static code = 'USER_EMAIL_EXISTS'
  static statusCode = 400
}

export class UserEmailPrimaryUnverifiedError extends BaseError {
  static defaultMessage = 'Cannot set unverified email as primary'
  static code = 'USER_EMAIL_PRIMARY_UNVERIFIED'
  static statusCode = 400
}
