import { BaseError, Info } from '@/modules/shared/errors/base'

/**
 * Use this to throw when the request has auth credentials, but they are not sufficient
 */
export class ForbiddenError extends BaseError {
  static code = 'FORBIDDEN'
  static defaultMessage = 'Access to the resource is forbidden'
  static statusCode = 403
}

/**
 * Use this in logic branches that should never execute, and if they do - it means
 * there's most definitely a bug in the code
 */
export class LogicError extends BaseError {
  static code = 'LOGIC_ERROR'
  static defaultMessage = 'An unexpected issue occurred'
}

/**
 * Use this to throw when the request lacks valid authentication credentials
 */
export class UnauthorizedError extends BaseError {
  static code = 'UNAUTHORIZED_ACCESS_ERROR'
  static defaultMessage = 'Attempted unauthorized access to data'
  static statusCode = 401
}

export class NotFoundError extends BaseError {
  static code = 'NOT_FOUND_ERROR'
  static defaultMessage = "These aren't the droids you're looking for."
  static statusCode = 404
}

export class BadRequestError extends BaseError {
  //FIXME why would we use this over an UserInputError?
  static code = 'BAD_REQUEST_ERROR'
  static defaultMessage = 'The request contains invalid data'
  static statusCode = 400
}

export class ResourceMismatch extends BaseError {
  static code = 'BAD_REQUEST_ERROR'
  static defaultMessage = 'The target resources mismatch'
  static statusCode = 400
}
/**
 * Use this to validate args
 */
export class InvalidArgumentError extends BaseError {
  static code = 'INVALID_ARGUMENT_ERROR'
  static defaultMessage = 'Invalid arguments received'
  static statusCode = 400
}

export class RichTextParseError extends BaseError {
  static code = 'RICH_TEXT_PARSE_ERROR'
  static defaultMessage =
    'An error occurred while trying to parse the rich text document'
  static statusCode = 400
}

export class ContextError extends BaseError {
  static code = 'CONTEXT_ERROR'
  static defaultMessage = 'The context is missing from the request'
  static statusCode = 500
}

export class MisconfiguredEnvironmentError extends BaseError {
  static code = 'MISCONFIGURED_ENVIRONMENT_ERROR'
  static defaultMessage =
    'An error occurred due to the server environment being misconfigured'
  static statusCode = 424
}

export class UninitializedResourceAccessError extends BaseError {
  static code = 'UNINITIALIZED_RESOURCE_ACCESS_ERROR'
  static defaultMessage = 'Attempted to use uninitialized resources'
  static statusCode = 500
}

export class EnvironmentResourceError extends BaseError {
  static code = 'ENVIRONMENT_RESOURCE_ERROR'
  static defaultMessage =
    'An error occurred while trying to access a resource in the environment.'
  static statusCode = 502
}

export class DatabaseError extends BaseError {
  static code = 'DATABASE_ERROR'
  static defaultMessage = 'An error occurred while trying to access the database.'
  static statusCode = 502
}

export { BaseError }
export type { Info }
