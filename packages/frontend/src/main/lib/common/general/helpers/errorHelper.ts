import { BaseError } from '@/helpers/errorHelper'

class UnexpectedErrorStructureError extends BaseError {
  static defaultMessage = 'An unexpected error type was thrown'
}

/**
 * In JS catch clauses can receive not only Errors, but pretty much any other kind of data type, so
 * you can use this helper to ensure that whatever is passed in is a real error
 */
export function ensureError(e: unknown, fallbackMessage?: string): Error {
  if (e instanceof Error) return e
  return new UnexpectedErrorStructureError(fallbackMessage)
}
