import { BaseError } from '@/modules/shared/errors'
import { Options } from 'verror'

export class UserInputError extends BaseError {
  static defaultMessage = 'Invalid user input.'
  static code = 'USER_INPUT_ERROR'

  constructor(message?: string | undefined, options?: Options | Error | undefined) {
    super(message, options)
  }
}

export class PasswordTooShortError extends UserInputError {
  constructor(minPasswordLength: number, options?: Options | Error | undefined) {
    super(
      `Password too short; needs to be ${minPasswordLength} characters or longer.`,
      options
    )
  }
}
