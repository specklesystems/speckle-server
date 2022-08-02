const _ = require('lodash')
const VError = require('verror')

/**
 * Some VError implementation details that we want to remove from object representations
 * of VErrors once they're converted to them
 */
const VERROR_TRASH_PROPS = ['jse_shortmsg', 'jse_cause', 'jse_info']

/**
 * Builds apollo server error formatter
 * @param {boolean} debug
 * @returns {(e: import('graphql').GraphQLError) => import('graphql').GraphQLFormattedError}
 */
function buildErrorFormatter(debug) {
  // TODO: Add support for client-aware errors and obfuscate everything else
  return function (error) {
    const debugMode = debug
    const realError = error.originalError ? error.originalError : error

    // If error isn't a VError child, don't do anything extra
    if (!(realError instanceof VError)) {
      return error
    }

    // Converting VError based error to Apollo's format
    const extensions = {
      ...(error.extensions || {}),
      ...(VError.info(realError) || {})
    }

    // Getting rid of redundant info
    delete extensions.originalError

    // Updating exception metadata in extensions
    if (extensions.exception) {
      extensions.exception = _.omit(extensions.exception, VERROR_TRASH_PROPS)

      if (debugMode) {
        extensions.exception.stacktrace = VError.fullStack(realError)
      } else {
        delete extensions.exception.stacktrace
      }
    }

    return {
      message: error.message,
      locations: error.locations,
      path: error.path,
      extensions
    }
  }
}

module.exports = {
  buildErrorFormatter
}
