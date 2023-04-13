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

export class UninitializedResourceAccessError extends BaseError {
  static defaultMessage = 'Attempting to access an uninitialized resource'
}

export class ComposableInvokedOutOfScopeError extends BaseError {
  static defaultMessage =
    'getCurrentInstance() returned null. Method must be called at the top of a setup function'
}

/**
 * Throw this when something that's only supported during CSR is invoked during SSR or vice versa
 */
export class UnsupportedEnvironmentError extends BaseError {
  static defaultMessage =
    'Operation not supported in current (server or client) environment'
}
