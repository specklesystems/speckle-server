const { BaseError } = require('./base')

class SpeckleForbiddenError extends BaseError {
  static code = 'FORBIDDEN_ERROR'
  static defaultMessage = 'Access to the resource is forbidden'
}

/**
 * Use this to throw when user tries to access data that he shouldn't have access to
 */
class SpeckleUnauthorizedError extends BaseError {
  static code = 'UNAUTHORIZED_ACCESS_ERROR'
  static defaultMessage = 'Attempted unauthorized access to data'
}

class SpeckleNotFoundError extends BaseError {
  static code = 'NOT_FOUND_ERROR'
  static defaultMessage = "These aren't the droids you're looking for."
}

class SpeckleResourceMismatch extends BaseError {
  static code = 'BAD_REQUEST_ERROR'
  static defaultMessage = 'The target resources mismatch'
}
/**
 * Use this to validate args
 */
class SpeckleInvalidArgumentError extends BaseError {
  static code = 'INVALID_ARGUMENT_ERROR'
  static defaultMessage = 'Invalid arguments received'
}

module.exports = {
  SpeckleForbiddenError,
  SpeckleUnauthorizedError,
  SpeckleNotFoundError,
  SpeckleResourceMismatch,
  SpeckleInvalidArgumentError
}
