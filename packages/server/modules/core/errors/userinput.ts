import { BaseError } from '@/modules/shared/errors'
import { Options } from 'verror'

export class UserInputError extends BaseError {
  static defaultMessage = 'Invalid user input.'
  static code = 'USER_INPUT_ERROR'

  constructor(message?: string | undefined, options?: Options | Error | undefined) {
    super(message, options)
  }
}
