/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { type Optional } from '@speckle/shared'
import type * as Observability from '@speckle/shared/dist/esm/observability/index'
import {
  upperFirst,
  get,
  isBoolean,
  isNumber,
  isObjectLike,
  isString,
  noop
} from 'lodash-es'
import type { Logger } from 'pino'

/**
 * Add pino-pretty like formatting
 */
export const prettify = (log: object, msg: string) =>
  msg.replace(/{([^{}]+)}/g, (match: string, p1: string) => {
    const val = get(log, p1)
    if (val === undefined) return match

    const formattedValue =
      isString(val) || isNumber(val) || isBoolean(val) ? val : JSON.stringify(val)
    return formattedValue as string
  })

/**
 * Wrap any logger call w/ logic that prettifies the error message like pino-pretty does
 * and emits bindings if they are provided
 */
const prettifiedLoggerFactory =
  (logger: (...args: unknown[]) => void, bindings?: () => Record<string, unknown>) =>
  (...vals: unknown[]) => {
    const finalVals = vals.slice()

    const firstObject = finalVals.find((v) => isObjectLike(v) && !Array.isArray(v))
    const firstMessageIdx = finalVals.findIndex(isString)

    if (firstMessageIdx !== -1) {
      const msg = finalVals[firstMessageIdx] as string
      finalVals.splice(firstMessageIdx, 1) // remove from array

      const finalMsg = prettify(firstObject || {}, msg)
      finalVals.unshift(finalMsg)
    }

    if (bindings) {
      const boundVals = JSON.parse(JSON.stringify(bindings()))
      finalVals.push(boundVals)
    }

    logger(...finalVals)
  }

export function buildFakePinoLogger(
  options?: Partial<{
    onError: (...args: any[]) => void
    /**
     * Returns an object that will be merged into the log context when outputting to the console.
     * These will not be sent to seq!
     */
    consoleBindings: () => Record<string, unknown>
  }>
) {
  const bindings = options?.consoleBindings

  const errLogger = (...args: unknown[]) => {
    const { onError } = options || {}
    if (onError) onError(...args)
    prettifiedLoggerFactory(console.error, bindings)(...args)
  }

  const logger = {
    debug: prettifiedLoggerFactory(console.debug, bindings),
    info: prettifiedLoggerFactory(console.info, bindings),
    warn: prettifiedLoggerFactory(console.warn, bindings),
    error: errLogger,
    fatal: errLogger,
    trace: prettifiedLoggerFactory(console.trace, bindings),
    silent: noop
  } as unknown as ReturnType<typeof Observability.getLogger>

  logger.child = () => logger as any

  return logger
}

export type SimpleError = {
  statusCode: number
  message: string
  stack?: string
}

export const formatAppError = (err: SimpleError): SimpleError => {
  const { statusCode, message, stack } = err

  let finalMessage = message || ''
  let finalStatusCode = statusCode || 500

  if (finalMessage.match(/^fetch failed$/i)) {
    finalMessage = 'Internal API call failed, please contact site administrators'
  }

  if (finalMessage.match(/status code 429/i)) {
    finalMessage =
      'You are sending too many requests. You have been rate limited. Please try again later.'
    finalStatusCode = 429
  }

  finalMessage = upperFirst(finalMessage)

  return {
    statusCode: finalStatusCode,
    message: finalMessage,
    stack
  }
}

export type AbstractErrorHandler = (
  params: {
    args: unknown[]
    firstString: Optional<string>
    firstError: Optional<Error>
    otherData: Record<string, unknown>
    nonObjectOtherData: unknown[]
  },
  helpers: {
    prettifyMessage: (msg: string) => string
  }
) => void

export type AbstractUnhandledErrorHandler = (params: {
  event: ErrorEvent | PromiseRejectionEvent
  isUnhandledRejection: boolean
  error: Error | unknown
  message: string
}) => void

export type AbstractErrorHandlerParams = Parameters<AbstractErrorHandler>[0]

/**
 * Adds proxy that intercepts error log calls so that they can be sent to any transport
 */
export function enableCustomErrorHandling(params: {
  logger: Logger
  onError: AbstractErrorHandler
}): Logger {
  const { logger, onError } = params
  return new Proxy(logger, {
    get(target, prop) {
      if (
        ['trace', 'debug', 'info', 'warn', 'error', 'fatal'].includes(prop as string)
      ) {
        const logMethod = get(target, prop) as (...args: unknown[]) => void
        return (...args: unknown[]) => {
          const log = logMethod.bind(target)

          const firstError = args.find((arg): arg is Error => arg instanceof Error)
          const isError = ['error', 'fatal'].includes(prop as string) || firstError

          if (isError) {
            const firstString = args.find(isString)
            const otherData: unknown[] = args.filter(
              (o) => !(o instanceof Error) && o !== firstString
            )

            const errorMessage = firstError?.message ?? firstString ?? `Unknown error`
            if (errorMessage !== firstString) {
              otherData.unshift(firstString)
            }

            const otherDataObjects = otherData.filter(isObjectLike)
            const otherDataNonObjects = otherData.filter((o) => !isObjectLike(o))
            const mergedOtherDataObject = Object.assign(
              {},
              ...otherDataObjects
            ) as Record<string, unknown>
            onError(
              {
                args,
                firstError,
                firstString,
                otherData: mergedOtherDataObject,
                nonObjectOtherData: otherDataNonObjects
              },
              { prettifyMessage: (msg) => prettify(mergedOtherDataObject, msg) }
            )
          }

          return log(...args)
        }
      }

      return get(target, prop)
    }
  })
}
