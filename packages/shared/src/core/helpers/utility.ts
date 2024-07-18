import { isNull, isNumber, isUndefined, noop } from '#lodash'
import type {
  MaybeAsync,
  NonNullableProperties,
  NullableKeysToOptional
} from './utilityTypes.js'
import { ensureError } from './error.js'

export class TimeoutError extends Error {}
export class WaitIntervalUntilCanceledError extends Error {}

/**
 * Build promise that can be resolved/rejected manually outside of the promise's execution scope
 */
export const buildManualPromise = <T>() => {
  let resolve: (value: T) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let reject: (reason?: any) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  const resolveWrapper: typeof resolve = (...args) => resolve(...args)
  const rejectWrapper: typeof reject = (...args) => reject(...args)

  return { promise, resolve: resolveWrapper, reject: rejectWrapper }
}

export const isNullOrUndefined = (val: unknown): val is null | undefined =>
  isNull(val) || isUndefined(val)

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const waitIntervalUntil = (ms: number, predicate: () => boolean) => {
  const { promise, resolve, reject } = buildManualPromise<void>()
  const interval = setInterval(() => {
    if (predicate()) {
      clearInterval(interval)
      resolve()
    }
  }, ms)

  const ret = promise as typeof promise & { cancel: () => void }
  ret.cancel = () => {
    clearInterval(interval)
    reject(new WaitIntervalUntilCanceledError())
  }

  return ret
}

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

/**
 * Invoke and return fn(), but retry it up to n times if it throws
 */
export const retry = async <V = unknown>(
  fn: () => MaybeAsync<V>,
  n: number,
  delayMs?: number | ((attempt: number, error: Error) => number)
) => {
  let lastError: Error | undefined
  for (let i = 0; i < n; i++) {
    try {
      const res = await Promise.resolve(fn())
      return res
    } catch (error) {
      lastError = ensureError(error)

      if (delayMs && i + 1 < n) {
        if (isNumber(delayMs)) {
          await wait(delayMs)
        } else {
          await wait(delayMs(i + 1, lastError))
        }
      }
    }
  }
  throw lastError
}

/**
 * For quickly profiling a function
 */
export const profile = async <V = unknown>(
  fn: () => MaybeAsync<V>,
  label?: string,
  extra?: unknown
) => {
  const start = performance.now()
  const res = await Promise.resolve(fn())
  const end = performance.now()
  console.log(
    `[${label || 'profile'}] took ${end - start}ms`,
    ...(extra ? [extra] : [])
  )
  return res
}

/**
 * For quickly profiling a sync function
 */
export const profileSync = <V = unknown>(
  fn: () => V,
  label?: string,
  extra?: unknown
) => {
  const start = performance.now()
  const res = fn()
  const end = performance.now()
  console.log(
    `[${label || 'profile'}] took ${end - start}ms`,
    ...(extra ? [extra] : [])
  )
  return res
}

export const removeNullOrUndefinedKeys = <T extends Record<string, unknown>>(
  obj: T
) => {
  const ret = {} as T
  for (const key in obj) {
    if (!isNullOrUndefined(obj[key])) {
      ret[key] = obj[key]
    }
  }
  return ret as NonNullableProperties<NullableKeysToOptional<T>>
}

export const isArrayOf = <T>(arr: unknown, guard: (v: unknown) => v is T): arr is T[] =>
  Array.isArray(arr) && arr.every(guard)

export const waitForever = (): Promise<never> => new Promise<never>(noop)
