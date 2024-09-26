/**
 * In JS catch clauses can receive not only Errors, but pretty much any other
 * kind of data type, so you can use this helper to ensure that
 * whatever is passed in is a real error.
 * If it is not a real error, it will be wrapped in a new error
 * with the provided message and the original error as the cause.
 */
export function ensureErrorOrWrapAsCause(e: unknown, fallbackMessage?: string): Error {
  if (e instanceof Error) return e
  return new Error(fallbackMessage, { cause: e })
}
