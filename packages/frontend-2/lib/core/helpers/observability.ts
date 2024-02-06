/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Observability } from '@speckle/shared'
import { get, isBoolean, isNumber, isObjectLike, isString, noop } from 'lodash-es'

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
 */
const log =
  (logger: (...args: unknown[]) => void) =>
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

    logger(...finalVals)
  }

export function buildFakePinoLogger(
  options?: Partial<{ onError: (...args: any[]) => void }>
) {
  const errLogger = (...args: unknown[]) => {
    const { onError } = options || {}
    if (onError) onError(...args)
    log(console.error)(...args)
  }

  const logger = {
    debug: log(console.debug),
    info: log(console.info),
    warn: log(console.warn),
    error: errLogger,
    fatal: errLogger,
    trace: log(console.trace),
    silent: noop
  } as unknown as ReturnType<typeof Observability.getLogger>

  logger.child = () => logger as any

  return logger
}
