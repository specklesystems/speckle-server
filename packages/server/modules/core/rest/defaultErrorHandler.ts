import { BaseError } from '@/modules/shared/errors'
import { isDevEnv } from '@/modules/shared/helpers/envHelper'
import { getCause } from '@/modules/shared/helpers/errorHelper'
import { Optional, ensureError } from '@speckle/shared'
import { ErrorRequestHandler } from 'express'
import { get, isNumber } from 'lodash'
import { VError } from 'verror'
import { logger as defaultLogger } from '@/logging/logging'

const resolveStatusCode = (e: Error): number => {
  if (e instanceof BaseError) {
    const infoStatus =
      e.info().statusCode && isNumber(e.info().statusCode)
        ? (e.info().statusCode as Optional<number>)
        : undefined

    if (infoStatus) return infoStatus
  }

  // Errors thrown by express itself, such as `express.json()` middleware aren't instances of BaseError but may have a statusCode or status property
  if (
    typeof e === 'object' &&
    'statusCode' in e &&
    typeof e.statusCode === 'number' &&
    e.statusCode >= 400 &&
    e.statusCode < 600
  ) {
    return e.statusCode
  }
  if (
    typeof e === 'object' &&
    'status' in e &&
    typeof e.status === 'number' &&
    e.status >= 400 &&
    e.status < 600
  ) {
    return e.status
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

  const logger = req.log || defaultLogger

  // Log unexpected types of errors which are not instances of BaseError or have a valid 'code' or 'statusCode' property
  if (
    !(err instanceof BaseError) &&
    !(
      typeof err === 'object' &&
      'statusCode' in err &&
      typeof err.statusCode === 'number' &&
      err.statusCode >= 400 &&
      err.statusCode < 600
    ) &&
    !(
      typeof err === 'object' &&
      'status' in err &&
      typeof err.status === 'number' &&
      err.status >= 400 &&
      err.status < 600
    )
  ) {
    logger.error(
      { err },
      `Unexpected type of error when handling ${req.originalUrl} from ${req.ip}. Please raise a bug report to the developers.`
    )
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
