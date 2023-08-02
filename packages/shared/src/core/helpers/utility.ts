import { isNull, isUndefined } from 'lodash'

export class TimeoutError extends Error {}

export const isNullOrUndefined = (val: unknown): val is null | undefined =>
  isNull(val) || isUndefined(val)

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Not nullable type guard, useful in `.filter()` calls for proper TS typed
 * results
 */
export const isNonNullable = <V>(v: V): v is NonNullable<typeof v> => !!v

/**
 * Make the promise throw after enough time has passed. Useful for implementing timeout functionality in various flows.
 */
export const timeoutAt = (ms: number, optionalMessage?: string) =>
  new Promise<never>((_resolve, reject) =>
    setTimeout(() => {
      reject(new TimeoutError(optionalMessage || 'timeoutAt() timed out'))
    }, ms)
  )
