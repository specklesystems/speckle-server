import { collectLongTrace } from '@speckle/shared'

/**
 * console.log replacement for development mode. Calls to this are skipped outside of dev mode
 * and it ensures that the real structured logger is used (if available)
 */
export const devLog = (...args: unknown[]) => {
  // eslint-disable-next-line no-console
  let logger = import.meta.dev ? console.log : undefined
  try {
    logger = useDevLogger()
  } catch {
    // suppress - can fail in some non-standard scopes
  }

  return logger?.(...args)
}

/**
 * Same as devLog, but also adds stack trace to each invocation
 */
export const devTrace = (...args: unknown[]) => {
  devLog(...args, collectLongTrace())
}
