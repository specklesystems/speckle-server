import {
  BaseError,
  type ExtendedOptions,
  type Info
} from '@/modules/shared/errors/base'
import type { Knex } from 'knex'
import { retrieveMetadataFromDatabaseClient } from '@/modules/shared/errors/databaseMetadata'

/**
 * Use this to throw when the request has auth credentials, but they are not sufficient
 */
export class ForbiddenError extends BaseError {
  static code = 'FORBIDDEN'
  static defaultMessage = 'Access to the resource is forbidden'
  static statusCode = 403
}

/**
 * Use this in logic branches that should never execute,
 * and which invalid user input alone should not be able to reach.
 * If this error is thrown it means there's most definitely a bug in the code
 */
export class LogicError extends BaseError {
  static code = 'LOGIC_ERROR'
  static defaultMessage = 'An unexpected issue occurred'
  static statusCode = 500
}

/**
 * Use this to throw when the request lacks valid authentication credentials.
 * Aka NonAuthorizedError or NotAuthorizedError
 */
export class UnauthorizedError extends BaseError {
  static code = 'UNAUTHORIZED_ACCESS_ERROR'
  static defaultMessage = 'Attempted unauthorized access to data'
  static statusCode = 401
}

/**
 * Use this to throw when there is not a more specific xNotFoundError to throw instead. e.g. UserNotFoundError or StreamNotFoundError
 */
export class NotFoundError extends BaseError {
  static code = 'NOT_FOUND_ERROR'
  static defaultMessage = "These aren't the droids you're looking for."
  static statusCode = 404
}

/**
 * Use this to throw when the request contains invalid headers, missing headers,
 * invalid http request method, or similar issues.
 * Where possible, use a ZodError or UserInputError - or a more specific xValidationError -
 * for body schema and content validation issues.
 */
export class BadRequestError extends BaseError {
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

/**
 * Middleware is expected to generate a context for each request
 * This error denotes issues in creating the context in the middleware,
 * or in consumers of the context if it is missing or invalid
 */
export class ContextError extends BaseError {
  static code = 'CONTEXT_ERROR'
  static defaultMessage = 'The context is missing from the request'
  static statusCode = 500
}

/**
 * Environment variables, files, or other configuration is missing or misconfigured
 */
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

export class NotImplementedError extends BaseError {
  static code = 'NOT_IMPLEMENTED'
  static defaultMessage = 'This feature is not yet implemented'
  static statusCode = 500
}

export class DatabaseError<I extends Info = Info> extends EnvironmentResourceError {
  static code = 'DATABASE_ERROR'
  static defaultMessage = 'An error occurred while trying to access the database.'
  static statusCode = 502

  constructor(
    message?: string | null,
    dbClient?: Knex,
    options: ExtendedOptions<I> | Error | undefined = undefined
  ) {
    const additionalInfo = retrieveMetadataFromDatabaseClient(dbClient)

    super(message, {
      ...options,
      info:
        options && 'info' in options
          ? { ...options?.info, ...additionalInfo }
          : additionalInfo
    })
  }
}

export class LoaderConfigurationError extends BaseError {
  static code = 'LOADER_CONFIGURATION_ERROR'
  static defaultMessage = 'Error while initializing authz loaders'
  static statusCode = 500

  constructor(message?: string) {
    super(message)
  }
}

export class LoaderUnsupportedError extends BaseError {
  static code = 'LOADER_UNSUPPORTED_ERROR'
  static defaultMessage =
    'Cannot invoke loader given current server configuration. Check environment variables.'
  static statusCode = 500
}

export class TestOnlyLogicError extends BaseError {
  static code = 'TEST_ONLY_LOGIC_ERROR'
  static defaultMessage = 'This code should only be executed during tests'
  static statusCode = 500
}

const getErrorInfoFromTransactions = (
  preparedTransactions: { knex: Knex; preparedTransactionId: string }[]
) => {
  return preparedTransactions.map(({ knex, preparedTransactionId: gid }) => ({
    db: retrieveMetadataFromDatabaseClient(knex),
    gid
  }))
}

// 2PC failed and we failed to rollback. A prepared transaction may have been left behind.
export class RegionalTransactionFatalError extends BaseError {
  static code = 'REGIONAL_TRANSACTION_FATAL_ERROR'
  static defaultMessage = 'Failed to rollback 2PC operation'
  static statusCode = 500

  constructor(
    message?: string | null,
    preparedTransactions: { knex: Knex; preparedTransactionId: string }[] = []
  ) {
    super(message, {
      info: {
        clients: getErrorInfoFromTransactions(preparedTransactions)
      }
    })
  }
}

export { BaseError }
export type { Info }
