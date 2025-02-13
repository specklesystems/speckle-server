import { RequestHandler } from 'express'
import { ensureError } from '@speckle/shared'
import { BaseError, LogicError } from '@/modules/shared/errors'

/**
 * @description Wraps an _external_ middleware function to ensure that any errors (passed to error handling middleware or thrown) will extend from BaseError. And ensures that thrown errors always result in a call to `next(err)`.
 * @param deps.verbPhraseForLogMessage - A phrase that describes the action being performed by the middleware
 */
export const handleMiddlewareErrors = <ExpectedErrorType extends BaseError>(deps: {
  wrappedRequestHandler: RequestHandler
  verbPhraseForLogMessage: string
  expectedErrorType: {
    new (message: string, info: { cause: Error }): ExpectedErrorType
  }
}): RequestHandler => {
  const {
    wrappedRequestHandler,
    verbPhraseForLogMessage: verbForLogging,
    expectedErrorType
  } = deps

  return (req, res, next) => {
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
        new expectedErrorType(`Error while ${verbForLogging}`, {
          cause: ensureError(err, `Unknown error handled while ${verbForLogging}`)
        })
      )
    }

    try {
      wrappedRequestHandler(req, res, nextWithWrappedError)
    } catch (err) {
      // This should never happen as middleware should not throw. It should have called `next(err)`. But just in case:

      next(
        new LogicError(
          `Unexpected error while ${verbForLogging}. The middleware should not have thrown.`,
          {
            cause: ensureError(err, `Unknown error thrown while ${verbForLogging}`)
          }
        )
      )
      return
    }
  }
}
