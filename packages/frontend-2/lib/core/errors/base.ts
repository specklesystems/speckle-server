/**
 * Base ObjectLoader error
 */
export abstract class BaseError extends Error {
  /**
   * Default message if none is passed
   */
  static defaultMessage = 'Unexpected error occurred'

  constructor(message?: string, options?: ErrorOptions) {
    message ||= new.target.defaultMessage
    super(message, options)
  }
}

/**
 * Throw these in execution branches that should never occur unless if there's a bug
 */
export class LogicError extends BaseError {
  static defaultMessage = 'An unexpected logic error occurred!'
}
