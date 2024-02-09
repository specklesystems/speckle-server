/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Observability } from '@speckle/shared'
import {
  upperFirst,
  get,
  isBoolean,
  isNumber,
  isObjectLike,
  isString,
  noop
} from 'lodash-es'

/**
 * Add pino-pretty like formatting
 */
const prettify = (log: object, msg: string) =>
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
const log =
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
    log(console.error, bindings)(...args)
  }

  const logger = {
    debug: log(console.debug, bindings),
    info: log(console.info, bindings),
    warn: log(console.warn, bindings),
    error: errLogger,
    fatal: errLogger,
    trace: log(console.trace, bindings),
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

export const formatAppError = (err: SimpleError) => {
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
