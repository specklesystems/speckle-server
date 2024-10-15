import { BaseError } from '@/modules/shared/errors'
import { isDevEnv } from '@/modules/shared/helpers/envHelper'
import { getCause } from '@/modules/shared/helpers/errorHelper'
import { Optional, ensureError } from '@speckle/shared'
import { ErrorRequestHandler } from 'express'
import { get, isNumber } from 'lodash'
import { VError } from 'verror'

const resolveStatusCode = (e: Error): number => {
  if (e instanceof BaseError) {
    const infoStatus =
      e.info().statusCode && isNumber(e.info().statusCode)
        ? (e.info().statusCode as Optional<number>)
        : undefined

    if (infoStatus) return infoStatus
  }

  return 500
}

const resolveErrorInfo = (e: Error): Record<string, unknown> => {
  const cause = getCause(e)
  const message = e.message
  let info = undefined
  if (e instanceof BaseError) {
    info = e.info()
  }

  return {
    message,
    code: (e instanceof BaseError ? e.info().code : get(e, 'code')) || e.name,
    ...(isDevEnv()
      ? {
          stack: e.stack,
          ...(e instanceof BaseError
            ? {
                info,
                stack: VError.fullStack(e)
              }
            : {}),
          ...(cause instanceof Error ? { cause: resolveErrorInfo(cause) } : {})
        }
      : {})
  }
}

/**
 * Convert error to JSON response w/ 500 status code
 */
export const defaultErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (!err) {
    return next()
  }

  const e = ensureError(err)
  // Add the error to the request context, this allows it to be logged by pino-http
  if (!req.context) req.context = { auth: false }
  if (!req.context.err) req.context.err = e
  res.status(resolveStatusCode(e)).json({
    error: resolveErrorInfo(e)
  })
  next(err)
}
