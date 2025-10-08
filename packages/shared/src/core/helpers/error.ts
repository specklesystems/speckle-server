import { get, isObject, isString, isUndefined } from '#lodash'

class UnexpectedErrorStructureError extends Error {}

/**
 * In JS catch clauses can receive not only Errors, but pretty much any other kind of data type, so
 * you can use this helper to ensure that whatever is passed in is a real error
 */
export function ensureError(
  e: unknown,
  fallbackMessage?: string
): Error | UnexpectedErrorStructureError {
  if (e instanceof Error) return e
  let stringifiedError = ''
  if (e !== null && e !== undefined) {
    try {
      stringifiedError = JSON.stringify(e)
    } catch {
      //ignore
    }
  }
  return new UnexpectedErrorStructureError(
    `${fallbackMessage}${stringifiedError !== '' ? `. Cause: ${stringifiedError}` : ''}`
  )
}

// this makes sure that a case is breaking in typing and in runtime too
export function throwUncoveredError(e: never): never {
  throw createUncoveredError(e)
}

export class UncoveredError extends Error {}

export function createUncoveredError(e: unknown) {
  let errorRepr = e

  if (typeof e === 'object') errorRepr = JSON.stringify(e)
  return new UncoveredError(`Uncovered error case ${errorRepr}.`)
}

/**
 * A custom error class that produces a cleaner stack trace when instantiated.
 */
export class CleanStackTrace extends Error {
  constructor() {
    super('')
    this.name = 'Stack trace:'
  }
}

/**
 * Note: Only V8 and Node.js support controlling the stack trace limit
 */
export const collectLongTrace = (limit?: number) => {
  const originalLimit = Error.stackTraceLimit
  Error.stackTraceLimit = limit || 30
  const trace = (new CleanStackTrace().stack || '')
    .split('\n')
    .slice(2) // remove "Error" and this function's own frame
    .join('\n')
    .trim()
  Error.stackTraceLimit = originalLimit
  return trace
}

/**
 * When you need to log a full error representation, w/ full .cause() support
 */
export const errorToString = (e: unknown): string => {
  if (!(e instanceof Error)) {
    try {
      return JSON.stringify(e)
    } catch {
      return String(e)
    }
  }

  let ret = e.stack || e.message || String(e)
  const causeProps = ['jse_cause', 'cause'] as const

  for (const prop of causeProps) {
    if (prop in e) {
      const cause = get(e, prop)
      if (!cause) continue

      ret += `\nCause: ${errorToString(cause)}`
      break // avoid chaining multiple causes
    }
  }

  return ret
}

export const getErrorMessage = (e: unknown): string => {
  if (e instanceof Error) return e.message
  if (isObject(e) && 'message' in e && isString(e.message)) return e.message
  if (isString(e)) return e
  if (isUndefined(e)) return 'undefined'

  try {
    return JSON.stringify(e)
  } catch {
    return String(e)
  }
}
