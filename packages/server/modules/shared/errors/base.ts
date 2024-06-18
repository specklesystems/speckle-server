import { Merge } from 'type-fest'
import { VError, Options, Info } from 'verror'

type ExtendedOptions<I extends Info = Info> = Merge<Options, { info?: Partial<I> }>

/**
 * Base application error (don't use directly, treat it as abstract). Built on top of `verror` so that you can
 * chain errors (e.cause is the previous error) and also add arbitrary metadata using the `info` option.
 *
 * This allows for much nicer error handling & monitoring
 */
export class BaseError<I extends Info = Info> extends VError {
  /**
   * Error code (override in child class)
   */
  static code = 'BASE_APP_ERROR'

  /**
   * Default message if none is passed
   */
  static defaultMessage = 'Unexpected error occurred!'

  /**
   * Status code to use if error is thrown in a REST API
   */
  static statusCode = 500

  constructor(
    message?: string | null | undefined,
    options: ExtendedOptions<I> | Error | undefined = undefined
  ) {
    // Resolve options correctly
    if (options) {
      const cause = options instanceof Error ? options : options.cause
      options = options instanceof Error ? { cause } : options
    } else {
      options = {}
    }

    const info = {
      ...(options.info || {}),
      code: new.target.code,
      statusCode: new.target.statusCode
    }

    options.info = info as unknown as I

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
    return BaseError.info(this) as Partial<I>
  }
}

export type { Info }
