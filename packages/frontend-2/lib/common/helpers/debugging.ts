/**
 * Wrap refs with writable computeds that output where reads/writes are coming from
 */
export function wrapRefWithTracking<R extends Ref<unknown>>(
  ref: R,
  name: string,
  options?: Partial<{
    writesOnly: boolean
    readsOnly: boolean
  }>
): R {
  const { writesOnly, readsOnly } = options || {}
  const getTrace = () => (new Error('Trace:').stack || '').substring(7)
  const logger = useLogger()

  return computed({
    get: () => {
      if (!writesOnly) {
        logger.debug(`debugging: '${name}' read`, ref.value, getTrace())
      }

      return ref.value
    },
    set: (newVal) => {
      if (!readsOnly) {
        logger.debug(`debugging: '${name}' written to`, newVal, getTrace())
      }

      ref.value = newVal
    }
    // hiding the real type so that you don't have to re-type everything that relies on the ref being a ref
  }) as unknown as R
}

/**
 * Use this to render a stack trace with clickable links to the source code in the browser console
 */
export class StackTrace extends Error {
  constructor() {
    super('')
    this.name = 'Stack trace:'
  }
}

export function getCurrentTrace() {
  return (new Error('Trace:').stack || '').substring(7)
}
