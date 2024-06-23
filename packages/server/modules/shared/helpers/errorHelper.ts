import { ensureError } from '@speckle/shared'
import { VError } from 'verror'

/**
 * Resolve cause correctly depending on whether its a VError or basic Error
 * object
 */
export function getCause(e: Error) {
  if (e instanceof VError) {
    return VError.cause(e)
  } else {
    const unknownCause = e.cause
    return unknownCause ? ensureError(e.cause) : null
  }
}

export { ensureError }
