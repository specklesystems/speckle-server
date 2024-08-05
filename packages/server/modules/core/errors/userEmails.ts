import { BaseError } from '@/modules/shared/errors/base'

export class UserEmailDeleteError extends BaseError {
  static defaultMessage = 'An issue occurred while attempting to delete a user email'
  static code = 'USER_EMAIL_DELETE_ERROR'
}
