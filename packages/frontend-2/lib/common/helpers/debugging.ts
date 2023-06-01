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

  return computed({
    get: () => {
      if (!writesOnly) {
        console.debug(`debugging: '${name}' read`, ref.value, getTrace())
      }

      return ref.value
    },
    set: (newVal) => {
      if (!readsOnly) {
        console.debug(`debugging: '${name}' written to`, newVal, getTrace())
      }

      ref.value = newVal
    }
    // hiding the real type so that you don't have to re-type everything that relies on the ref being a ref
  }) as unknown as R
}
