import { RequestHandler } from 'express'
import { ensureError } from '@speckle/shared'
import { BaseError, LogicError } from '@/modules/shared/errors'

/**
 * @description Wraps an Express RequestHandler to ensure that any errors will extend from BaseError. It also ensures that thrown errors always result in a call to `next(err)`.
 * @param deps.verbPhraseForErrorMessage - A phrase that describes the action being performed by the middleware. Will appear as `Error while ${verbPhraseForErrorMessage}` in the error message.
 * @param deps.expectedErrorType - The error type that the middleware is expected to throw. Defaults to LogicError, which is appropriate for middleware we control as we should be handling errors within it. For external middleware, you may want to use a different error type.
 */
export const handleErrors = <ExpectedErrorType extends BaseError>(deps: {
  handler: RequestHandler
  verbPhraseForErrorMessage: string
  defaultErrorType?: {
    new (message: string, info: { cause: Error }): ExpectedErrorType
  }
}): RequestHandler => {
  const {
    handler: wrappedRequestHandler,
    verbPhraseForErrorMessage: verbPhraseForLogMessage,
    defaultErrorType = LogicError
  } = deps

  return async (req, res, next) => {
    const nextWithWrappedError = (err: unknown) => {
      if (!err) {
        next()
        return
      }

      // we want to always pass an error which is extended from BaseError
      // as this provides the error handler with a status code property from
      // which it can determine how best to handle the error
      if (err instanceof BaseError) {
        next(err)
        return
      }

      next(
        new defaultErrorType(`Error while ${verbPhraseForLogMessage}`, {
          cause: ensureError(
            err,
            `Unknown error handled while ${verbPhraseForLogMessage}`
          )
        })
      )
    }

    try {
      await wrappedRequestHandler(req, res, nextWithWrappedError)
    } catch (err) {
      // The middleware should have thrown an error extended from BaseError, but if it didn't, we need to handle it here.
      if (err instanceof BaseError) {
        next(err)
        return
      }

      next(
        new defaultErrorType(
          `Unexpected error thrown while ${verbPhraseForLogMessage}.`,
          {
            cause: ensureError(
              err,
              `Unknown error thrown while ${verbPhraseForLogMessage}`
            )
          }
        )
      )
      return
    }
  }
}
