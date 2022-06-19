const { BaseError } = require('./base')

class ForbiddenError extends BaseError {
  static code = 'FORBIDDEN_ERROR'
  static defaultMessage = 'Access to the resource is forbidden'
}

/**
 * Use this to throw when user tries to access data that he shouldn't have access to
 */
class UnauthorizedError extends BaseError {
  static code = 'UNAUTHORIZED_ACCESS_ERROR'
  static defaultMessage = 'Attempted unauthorized access to data'
}

class NotFoundError extends BaseError {
  static code = 'NOT_FOUND_ERROR'
  static defaultMessage = "These aren't the droids you're looking for."
}

class ResourceMismatch extends BaseError {
  static code = 'BAD_REQUEST_ERROR'
  static defaultMessage = 'The target resources mismatch'
}
/**
 * Use this to validate args
 */
class InvalidArgumentError extends BaseError {
  static code = 'INVALID_ARGUMENT_ERROR'
  static defaultMessage = 'Invalid arguments received'
}
class RichTextParseError extends BaseError {
  static code = 'RICH_TEXT_PARSE_ERROR'
  static defaultMessage =
    'An error occurred while trying to parse the rich text document'
}

class ContextError extends BaseError {
  static code = 'CONTEXT_ERROR'
  static defaultMessage = 'The context is missing from the request'
}

module.exports = {
  ForbiddenError,
  UnauthorizedError,
  NotFoundError,
  ResourceMismatch,
  InvalidArgumentError,
  RichTextParseError,
  ContextError
}
