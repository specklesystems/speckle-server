/**
 * Base application error
 */
export abstract class BaseError extends Error {
  /**
   * Default message if none is passed
   */
  static defaultMessage = 'Unexpected error occurred!'

  constructor(message?: string, options?: ErrorOptions) {
    message ||= new.target.defaultMessage
    super(message, options)
  }
}
