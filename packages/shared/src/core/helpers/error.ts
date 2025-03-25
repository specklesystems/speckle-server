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

export function createUncoveredError(e: never) {
  return new UncoveredError(`Uncovered error case ${e}.`)
}

/**
 * Note: Only V8 and Node.js support controlling the stack trace limit
 */
export const collectLongTrace = (limit?: number) => {
  const originalLimit = Error.stackTraceLimit
  Error.stackTraceLimit = limit || 30
  const trace = (new Error().stack || '').split('\n').slice(1).join('\n').trim()
  Error.stackTraceLimit = originalLimit
  return trace
}
