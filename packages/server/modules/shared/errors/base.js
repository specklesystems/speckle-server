const VError = require('verror')

/**
 * Base application error (don't use directly, treat it as abstract). Built on top of `verror` so that you can
 * chain errors (e.cause is the previous error) and also add arbitrary metadata using the `info` option.
 *
 * This allows for much nicer error handling & monitoring
 */
class BaseError extends VError {
  /**
   * Error code (override in child class)
   */
  static code = 'BASE_APP_ERROR'

  /**
   * Default message if none is passed
   */
  static defaultMessage = 'Unexpected error occurred!'

  /**
   * @param {string | null} message
   * @param {import('verror').Options | Error} options
   */
  constructor(message, options) {
    // Resolve options correctly
    if (options) {
      const cause = options instanceof Error ? options : options.cause
      options = options instanceof Error ? { cause } : options
    } else {
      options = {}
    }

    const info = {
      ...(options.info || {}),
      code: new.target.code
    }

    options.info = info

    // Get message from defaultMessage, if it's empty
    if (!message) {
      message = new.target.defaultMessage
    }

    // Resolve constructor name
    const constructorName = new.target.name
    options.name = constructorName

    super(options, message)
  }

  /**
   * Get collected info of this object and previous errors
   */
  info() {
    return BaseError.info(this)
  }
}

module.exports = { BaseError }
