/**
 * Base ObjectLoader error
 */
class BaseError extends Error {
  /**
   * Default message if none is passed
   */
  static defaultMessage = 'Unexpected error occurred'

  /**
   * @param {string} [message]
   * @param {ErrorOptions} options
   */
  constructor(message, options) {
    message ||= new.target.defaultMessage
    super(message, options)
  }
}

export class ObjectLoaderConfigurationError extends BaseError {
  static defaultMessage = 'Object loader configured incorrectly!'
}

export class ObjectLoaderRuntimeError extends BaseError {
  static defaultMessage = 'Object loader encountered a runtime problem!'
}
